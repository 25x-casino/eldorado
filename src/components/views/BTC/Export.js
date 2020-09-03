import React, { Component } from 'react'
import { createObserver, collect } from 'dop'
import styled from 'styled-components'

// import { createWorker } from '/api/workers'
import { Coins } from '/api/coins'
import { generateQRCode } from '/api/qr'
import { BTC } from '/api/coins'
import { encryptBIP38 } from '/api/coins/BTC'
import { printTemplate } from '/api/browser'

import state from '/store/state'
import {
    getAsset,
    isAssetWithSeed,
    getPrivateKey,
    getSeed,
    getParamsFromLocation
} from '/store/getters'

import { routes, Show } from '/store/router'
import styles from '/const/styles'

import Div from '/components/styled/Div'
import Button from '/components/styled/Button'
import Input from '/components/styled/Input'
import Select from '/components/styled/Select'
import CenterElement from '/components/styled/CenterElement'
import {
    FormField,
    FormFieldLeft,
    FormFieldRight,
    FormFieldButtons
} from '/components/styled/Form'
import { Label, SubLabel } from '/components/styled/Label'

import { PrivateKey as template, Words as template2 } from '/const/paperwallets'

const TYPES_EXPORTS = {
    seed: 'seed',
    wif: 'wif',
    bip: 'bip'
}

export default class ExportBTC extends Component {
    componentWillMount() {
        this.observer = createObserver(m => this.forceUpdate())
        this.observer.observe(state.view)

        const { asset_id } = getParamsFromLocation()
        this.asset_id = asset_id
        this.is_asset_with_seed = isAssetWithSeed(this.asset_id)
        this.asset = getAsset(this.asset_id)
        this.Coin = Coins[this.asset.symbol] // Storing Coin api (Coin.BTC, Coin.ETH, ...)

        // Initial state
        state.view = {
            type_export: this.is_asset_with_seed
                ? TYPES_EXPORTS.seed
                : TYPES_EXPORTS.wif,
            loading: false,
            address_selected: this.asset.addresses[
                this.asset.addresses.length - 1
            ],
            password: '',
            invalid_password: false
        }

        // binding
        this.onChangeTypeExport = this.onChangeTypeExport.bind(this)
        this.onChangeAddress = this.onChangeAddress.bind(this)
        this.onChangePassword = this.onChangePassword.bind(this)
        this.onExport = this.onExport.bind(this)
    }
    componentWillUnmount() {
        this.observer.destroy()
    }
    shouldComponentUpdate() {
        return false
    }

    onChangeTypeExport(e) {
        state.view.type_export = e.target.value
    }
    onChangeAddress(e) {
        state.view.address_selected = e.target.value
    }
    onChangePassword(e) {
        const collector = collect()
        state.view.password = e.target.value
        state.view.invalid_password = false
        collector.emit()
    }
    onExport(e) {
        e.preventDefault()
        const type_export = state.view.type_export
        const asset_id = this.asset_id
        const asset = getAsset(asset_id)
        const address = this.Coin.formatAddress(state.view.address_selected)
        const password = state.view.password

        // Seed
        if (type_export === TYPES_EXPORTS.seed) {
            const seed = getSeed(asset_id, password)
            if (seed) printTemplate(template2(seed))
            else state.view.invalid_password = true
        } else {
            // Private Key
            const private_key = getPrivateKey(asset_id, password, address)
            if (private_key) {
                state.view.loading = true
                setTimeout(() => {
                    // We need to do this trick in order to show the loading-button icon
                    const isEncrypted = type_export === TYPES_EXPORTS.bip
                    // const formats = getAllFormats(private_key, true)
                    let private_key1 = private_key
                    // let private_key2 = formats.compressed
                    //     ? formats.private_key
                    //     : formats.private_key_comp
                    if (isEncrypted) {
                        private_key1 = encryptBIP38(private_key1, password)
                        // private_key2 = encryptBIP38(private_key2, password)
                    }
                    const qrs = [
                        {
                            img: generateQRCode(address),
                            hash: address,
                            title: 'Address',
                            description:
                                'You can share this address to receive funds.'
                        },
                        {
                            img: generateQRCode(
                                private_key1,
                                undefined,
                                isEncrypted ? 'black' : styles.color.red3
                            ),
                            hash: private_key1,
                            red: !isEncrypted,
                            title: 'Private Key',
                            description:
                                'This CAN NOT BE SHARED. If you share this you will lose your funds. ' +
                                (isEncrypted
                                    ? 'Encrypted (BIP38)'
                                    : 'Unencrypted (WIF)')
                        } /*,
                        {
                            title: `Address ${
                                formats.compressed
                                    ? 'uncompressed'
                                    : 'compressed'
                            }`,
                            hash: formats.compressed
                                ? formats.address
                                : formats.address_comp
                        },
                        {
                            title: `Private Key (${
                                isEncrypted
                                    ? 'Encrypted BIP38'
                                    : 'Unencrypted WIF'
                            } ${
                                formats.compressed
                                    ? 'uncompressed'
                                    : 'compressed'
                            }). DO NOT SHARE THIS OR YOU WILL LOSE YOUR FUNDS`,
                            hash: private_key2,
                            red: !isEncrypted
                        },
                        {
                            title: `Public Key`,
                            hash: formats.public_key
                        },
                        {
                            title: `Public Key compressed`,
                            hash: formats.public_key_comp
                        }*/
                    ]
                    // data.address_qr = generateQRCode(data.address)
                    // data.address_comp_qr = generateQRCode(data.address_comp)
                    // data.private_key_qr = generateQRCode(data.private_key, undefined, styles.color.red3)
                    // data.private_key_comp_qr = generateQRCode(data.private_key_comp, undefined, styles.color.red3)
                    printTemplate(template(qrs))
                    state.view.loading = false
                }, 0)
            } else {
                state.view.invalid_password = true
            }
        }
    }
    render() {
        return React.createElement(ExportBTCTemplate, {
            type_export: state.view.type_export,
            is_asset_with_seed: this.is_asset_with_seed,
            addresses: this.asset.addresses,
            address_selected: state.view.address_selected,
            password: state.view.password,
            invalid_password: state.view.invalid_password,
            loading: state.view.loading,
            onChangeTypeExport: this.onChangeTypeExport,
            onChangeAddress: this.onChangeAddress,
            onChangePassword: this.onChangePassword,
            onExport: this.onExport
        })
    }
}

function ExportBTCTemplate({
    loading,
    type_export,
    addresses,
    address_selected,
    is_asset_with_seed,
    password,
    invalid_password,
    onChangeTypeExport,
    onChangeAddress,
    onChangePassword,
    onExport
}) {
    return (
        <Div>
            <form>
                <FormField>
                    <FormFieldLeft>
                        <Label>Format</Label>
                        <Show if={type_export === TYPES_EXPORTS.bip}>
                            <SubLabel>
                                You have to remember your current password in
                                order to import this asset in the future.
                            </SubLabel>
                        </Show>
                    </FormFieldLeft>
                    <FormFieldRight>
                        <Select width="100%" onChange={onChangeTypeExport}>
                            <option
                                disabled={!is_asset_with_seed}
                                value={TYPES_EXPORTS.seed}
                                selected={type_export === TYPES_EXPORTS.seed}
                            >
                                Recovery Phrase (12 words)
                            </option>
                            <option
                                value={TYPES_EXPORTS.wif}
                                selected={type_export === TYPES_EXPORTS.wif}
                            >
                                Private Key Unencrypted (WIF)
                            </option>
                            <option
                                value={TYPES_EXPORTS.bip}
                                selected={type_export === TYPES_EXPORTS.bip}
                            >
                                Private Key Encrypted (BIP38)
                            </option>
                        </Select>
                    </FormFieldRight>
                    {/* <Checkbox
                        checked={encrypted}
                        onChange={onChangeTypeExport}
                        label="Encrypted (BIP38)"
                    /> */}
                </FormField>
                <Show
                    if={
                        is_asset_with_seed &&
                        (type_export === TYPES_EXPORTS.wif ||
                            type_export === TYPES_EXPORTS.bip)
                    }
                >
                    <FormField>
                        <FormFieldLeft>
                            <Label>Address</Label>
                        </FormFieldLeft>
                        <FormFieldRight>
                            <Select width="100%" onChange={onChangeAddress}>
                                {addresses.map(addr => (
                                    <option
                                        selected={addr === address_selected}
                                    >
                                        {addr}
                                    </option>
                                ))}
                            </Select>
                        </FormFieldRight>
                        {/* <Checkbox
                        checked={encrypted}
                        onChange={onChangeTypeExport}
                        label="Encrypted (BIP38)"
                    /> */}
                    </FormField>
                </Show>
                <FormField>
                    <FormFieldLeft>
                        <Label>Password</Label>
                        <SubLabel>Password of this wallet.</SubLabel>
                    </FormFieldLeft>
                    <FormFieldRight>
                        <Input
                            width="100%"
                            value={password}
                            onChange={onChangePassword}
                            type="password"
                            error={'Invalid password'}
                            invalid={invalid_password}
                        />
                    </FormFieldRight>
                </FormField>
                <FormField>
                    <FormFieldButtons>
                        <Button
                            onClick={onExport}
                            loading={loading}
                            loadingIco="/static/image/loading.gif"
                        >
                            Unlock and Print
                        </Button>
                        <Show if={loading && type_export === TYPES_EXPORTS.bip}>
                            <Div font-size="10px" color={styles.color.red}>
                                This might take several minutes<br />and can
                                freeze your browser
                            </Div>
                        </Show>
                    </FormFieldButtons>
                </FormField>
            </form>
        </Div>
    )
}

// const myWorker = createWorker(encryptBIP38)
// myWorker.postMessage(['5HsWaFzgZp2T5t3REnMFGMroTc3WvvsPGMbBejRinUnbWenCg9n', 'cacavaca'])
// myWorker.addEventListener('message', e => {
//     console.log('Message received from worker', e.data)
// })
