import React from 'react'
import { set, collect } from 'dop'
import { sha3 } from 'ethereumjs-util'

import styles from '/const/styles'

import {
    MAINNET,
    KEYS_TO_REMOVE_WHEN_EXPORTING,
    OK,
    ERROR,
    ALERT,
    NORMAL,
    TIMEOUT_FETCH_PRICES,
    TIMEOUT_FETCH_PRICES_TIMEOUT,
    TIMEOUT_UPDATE_ALL_BALANCES,
    TIMEOUT_BETWEEN_EACH_GETBALANCE,
    LOCALSTORAGE_NETWORK,
    LOCALSTORAGE_FIAT,
    LOCALSTORAGE_ASSETS,
    LOCALSTORAGE_ASSETSEXPORTED,
    LOCALSTORAGE_CUSTOMS,
    TYPE_ERC20
} from '/const/'

import { resolveAll } from '/api/promises'
import { Coins } from '/api/coins'
import { createERC20 } from '/api/coins/ERC20'
import { median } from '/api/arrays'
import { getAllPrices } from '/api/prices'
import { decimals, bigNumber } from '/api/numbers'
import { jsonParse } from '/api/objects'
import {
    localStorageSet,
    localStorageRemove,
    localStorageGet,
    openFile,
    readFile,
    downloadFile,
    locationHref
} from '/api/browser'

import { routes } from '/store/router'
import state from '/store/state'
import {
    getTotalAssets,
    getAssetsAsArray,
    generateDefaultAsset,
    generateDefaultBackup,
    getNextAssetId,
    getAsset,
    getAssetId,
    getSymbolsFromAssets,
    isValidAsset,
    getAddresses
} from '/store/getters'

export function setHref(href) {
    const collector = collect()
    state.location.href = href
    state.sideMenuOpen = false
    collector.emit()
}

export function createAsset(type, symbol, address, addresses) {
    const collector = collect()
    const asset = generateDefaultAsset({ type, symbol, address, addresses })
    const asset_id = getNextAssetId(asset)
    state.assets[asset_id] = asset
    saveAssetsLocalstorage()
    setAssetsExported(false)
    sendEventToAnalytics('createAsset', symbol)
    collector.emit()
    return state.assets[asset_id]
}

export function changeAddress(asset_id, address) {
    const asset = getAsset(asset_id)
    asset.address = address
    saveAssetsLocalstorage()
    fetchFullBalance(asset_id)
    fetchTxs(asset_id)
}

export function addAddress(asset_id, address) {
    const asset = getAsset(asset_id)
    asset.addresses.push(address)
    saveAssetsLocalstorage()
}

export function setPrivateKey(asset_id, private_key, password) {
    return setPrivateKeyOrSeed(asset_id, private_key, password, false)
}

export function setSeed(asset_id, seed, password) {
    return setPrivateKeyOrSeed(asset_id, seed, password, true)
}

export function setPrivateKeyOrSeed(asset_id, key, password, is_seed) {
    const asset = getAsset(asset_id)
    const method =
        Coins[asset.symbol][is_seed ? 'encryptSeed' : 'encryptPrivateKey']
    const seed_encrypted = set(
        asset,
        is_seed ? 'seed' : 'private_key',
        method(key, password),
        {
            deep: false
        }
    )
    if (is_seed) seed_encrypted.hash = sha3(key).toString('hex')
    saveAssetsLocalstorage()
    setAssetsExported(false)
}

// export function copyPrivateKey(asset_id_from, asset_id_to) {
//     const from = state.assets[asset_id_from]
//     const to = state.assets[asset_id_to]
//     set(to, 'private_key', from.private_key, { deep: false })
//     saveAssetsLocalstorage()
//     setAssetsExported(false)
// }

export function assetDelete(asset_id) {
    const collector = collect()
    delete state.assets[asset_id]
    saveAssetsLocalstorage()
    setAssetsExported(false)
    collector.emit()
}

export function saveAssetsLocalstorage() {
    const assets = JSON.stringify(state.assets, (key, value) => {
        key = key.toLocaleLowerCase()
        return key === 'state' ? undefined : value
    })
    localStorageSet(LOCALSTORAGE_ASSETS, assets, state.network)
}

export function setAssetsExported(value) {
    // state.assetsExported = value
    localStorageSet(LOCALSTORAGE_ASSETSEXPORTED, value, state.network)
}

export function exportBackup(a_element) {
    const data = generateDefaultBackup()
    // assets
    data.assets = JSON.parse(
        JSON.stringify(state.assets, (key, value) => {
            key = key.toLocaleLowerCase()
            if (key === 'addresses') {
                return Array.isArray(value) && value.length > 1
                    ? value
                    : undefined
            }
            return KEYS_TO_REMOVE_WHEN_EXPORTING.indexOf(key) > -1
                ? undefined
                : value
        })
    )

    // custom tokens/coins
    data.customs = jsonParse(
        localStorageGet(LOCALSTORAGE_CUSTOMS, state.network)
    )
    // console.log('exportBackup', data)
    downloadFile({
        data: btoa(unescape(encodeURIComponent(JSON.stringify(data)))),
        a: a_element,
        name: 'YOU_MUST_RENAME_THIS_FOR_SECURITY'
    })
    setAssetsExported(true)
}

export function importBackupFromFile() {
    const assetsExported =
        localStorageGet(LOCALSTORAGE_ASSETSEXPORTED, state.network) === 'true'
    if (state.totalAssets > 0 && !assetsExported) {
        state.popups.closeSession.confirm = () => {
            state.popups.closeSession.open = false
            // setAssetsExported(true) // Not sure if should ask again after a failed import
            openImportAssetsFromFile()
        }
        state.popups.closeSession.cancel = () => {
            state.popups.closeSession.open = false
        }
        state.popups.closeSession.open = true
    } else openImportAssetsFromFile()
}

export function openImportAssetsFromFile() {
    openFile(file => {
        readFile(file, dataString => importBackup(dataString))
    })
}

export function importBackup(dataString) {
    try {
        let data = JSON.parse(decodeURIComponent(escape(atob(dataString))))

        // cheking if the file imported is an old version
        if (data.v === undefined || data.network === undefined)
            data = generateDefaultBackup({ assets: data })
        // console.log('importBackup', data)

        // cheking if we are in the right mode
        if (data.network !== state.network) {
            const first = state.network === MAINNET ? 'mainnet' : 'testnet'
            const second = data.network === MAINNET ? 'mainnet' : 'testnet'
            return addNotification(
                `You are in ${first} mode and this backup is from ${second}.`,
                ERROR
            )
        }

        // importing customs
        const customs = data.customs
        for (let symbol in customs) {
            if (Coins[symbol] === undefined) {
                if (customs[symbol].type === TYPE_ERC20) {
                    createCustomERC20(customs[symbol])
                }
            }
        }

        // importing assets
        const assets = data.assets
        for (let asset_id in assets)
            if (isValidAsset(assets[asset_id]))
                assets[asset_id] = generateDefaultAsset(assets[asset_id])
        const total_assets = getTotalAssets(assets)
        if (total_assets > 0) {
            const collector = collect()
            state.assets = assets
            setHref(routes.home())
            addNotification(`You have imported ${total_assets} Assets`, OK)
            saveAssetsLocalstorage()
            setAssetsExported(true)
            fetchAllBalances()
            fetchPrices()
            collector.emit()
        } else {
            addNotification(
                "We couldn't find any Asset to Import on this JSON file",
                ERROR
            )
        }
    } catch (e) {
        console.error(e)
        addNotification("We couldn't parse the JSON file", ERROR)
    }
}

export function closeSession() {
    const assetsExported =
        localStorageGet(LOCALSTORAGE_ASSETSEXPORTED, state.network) === 'true'
    if (state.totalAssets > 0) {
        if (!assetsExported) {
            state.popups.closeSession.confirm = forceLoseSession
            state.popups.closeSession.cancel = () => {
                state.popups.closeSession.open = false
            }
            state.popups.closeSession.open = true
        } else forceLoseSession()
    }
}

export function changeNetwork(network) {
    localStorageSet(LOCALSTORAGE_NETWORK, network)
    locationHref('/')
}

export function forceLoseSession() {
    setAssetsExported(true)
    localStorageRemove(LOCALSTORAGE_ASSETS, state.network)
    locationHref('/')
}

let idNotification = 0
export function addNotification(text, color = OK, timeout = 6000) {
    state.notifications[idNotification] = {
        id: idNotification,
        text: text,
        color: color,
        timeout: timeout
    }
    return idNotification++
}

export function deleteNotification(id) {
    delete state.notifications[id]
}

export function changeFiat(symbol) {
    const collector = collect()
    state.fiat = symbol
    localStorageSet(LOCALSTORAGE_FIAT, symbol)
    fetchPrices()
    collector.emit()
}

export function updatePrice(symbol, value) {
    const collector = collect()
    state.prices[symbol] = value
    localStorageSet(symbol, decimals(value))
    collector.emit()
}

let idNotificationNotConnection
export function showNotConnectionNotification(value) {
    if (value && idNotificationNotConnection === undefined) {
        idNotificationNotConnection = addNotification(
            "Seems like you don't have internet connection",
            NORMAL,
            null
        )
    } else if (!value && idNotificationNotConnection !== undefined) {
        deleteNotification(idNotificationNotConnection)
        idNotificationNotConnection = undefined
    }
}

export function setAssetLabel(asset_id, label) {
    const collector = collect()
    state.assets[asset_id].label = label
    collector.emit()
}

export function updateBalance(asset_id, balance) {
    const asset = getAsset(asset_id)
    asset.balance = balance
}

export function createCustomERC20(data) {
    const { symbol } = data
    data.type = TYPE_ERC20
    data.custom = true
    Coins[symbol] = createERC20(data)
    // Coins[symbol].networks_availables = [state.network]
    saveCustomLocalstorage(data)
}

export function saveCustomLocalstorage(data) {
    const coins_localstorage = jsonParse(
        localStorageGet(LOCALSTORAGE_CUSTOMS, state.network)
    )
    coins_localstorage[data.symbol] = data
    localStorageSet(
        LOCALSTORAGE_CUSTOMS,
        JSON.stringify(coins_localstorage),
        state.network
    )
}

export function deleteCustomERC20(symbol) {
    const coins_localstorage = jsonParse(
        localStorageGet(LOCALSTORAGE_CUSTOMS, state.network)
    )
    delete coins_localstorage[symbol]
    delete Coins[symbol]
    localStorageSet(
        LOCALSTORAGE_CUSTOMS,
        JSON.stringify(coins_localstorage),
        state.network
    )
}

// Fetchers

export function fetchWrapper(promise) {
    // console.log('fetchWrapper')
    return promise
        .then(result => {
            // console.log('then', result)
            showNotConnectionNotification(false)
            return result
        })
        .catch(e => {
            // console.log('catch')
            showNotConnectionNotification(true)
            return Promise.reject(e)
        })
}

export function fetchAllBalances() {
    getAssetsAsArray().forEach((asset, index) => {
        setTimeout(
            () => fetchFullBalance(getAssetId(asset)),
            index * TIMEOUT_BETWEEN_EACH_GETBALANCE
        )
    })
    setTimeout(fetchAllBalances, TIMEOUT_UPDATE_ALL_BALANCES)
}
fetchAllBalances()

export function fetchBalance(asset_id) {
    const asset = getAsset(asset_id)
    if (asset !== undefined) {
        return fetchWrapper(
            Coins[asset.symbol].fetchBalance(asset.address)
        ).then(balance => {
            updateBalance(asset_id, balance)
            return balance
        })
    }
}

export function fetchFullBalance(asset_id) {
    const asset = getAsset(asset_id)
    if (asset !== undefined) {
        const Coin = Coins[asset.symbol]
        const promises = getAddresses(asset_id).map(addr =>
            Coin.fetchBalance(addr)
        )
        return fetchWrapper(resolveAll(promises)).then(balances => {
            const total = balances
                .reduce((t, balance) => t.add(balance), bigNumber(0))
                .toFixed()
            updateBalance(asset_id, total)
            return total
        })
    }
}

export function fetchTxs(asset_id) {
    const args = Array.prototype.slice.call(arguments, 1)
    const asset = getAsset(asset_id)
    if (asset !== undefined) {
        const Coin = Coins[asset.symbol]
        args.unshift(getAddresses(asset_id))

        asset.summary.fetching = true
        return fetchWrapper(Coin.fetchTxs.apply(this, args))
            .then(txs => {
                const collector = collect()
                asset.summary.fetching = false
                asset.summary.totalTxs = txs.totalTxs
                asset.summary.txs = txs.txs
                collector.emit()
            })
            .catch(e => {
                asset.summary.fetching = false
            })
    }
}

export const fetchPrices = (function() {
    let timeout
    return function() {
        // console.log('fetchPrices')
        // TIMEOUT_FETCH_PRICES
        clearTimeout(timeout)
        const cryptos = getSymbolsFromAssets()
        if (cryptos.length > 0) {
            getAllPrices(
                cryptos,
                state.fiat,
                TIMEOUT_FETCH_PRICES_TIMEOUT
            ).then(prices => {
                // console.log('fetchPrices', prices)
                cryptos.forEach(crypto => {
                    if (prices[crypto].length > 0)
                        updatePrice(crypto, median(prices[crypto]))
                })
                timeout = setTimeout(fetchPrices, TIMEOUT_FETCH_PRICES)
            })
        }
    }
})()
fetchPrices()

export function sendEventToAnalytics() {
    if (
        state.network === MAINNET &&
        typeof ga == 'function' &&
        locationHref().indexOf('eldorado.blue') === 8
    ) {
        const args = Array.prototype.slice.call(arguments, 0)
        args.unshift('send', 'event')
        ga.apply(this, args)
    }
}