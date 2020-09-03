import React, { Component } from 'react'
import styled from 'styled-components'
import { createObserver, collect } from 'dop'

import styles from '/const/styles'
import { minpassword, recovery_phrase_words } from '/const/'

import { bigNumber } from '/api/numbers'
import { Coins } from '/api/coins'
import { validateSeed } from '/api/bip39'

import { setHref, createAsset, setSeed, addNotification } from '/store/actions'
import state from '/store/state'
import {
    isAssetRegisteredBySeed,
    getAssetId,
    getParamsFromLocation
} from '/store/getters'
import { routes, Show } from '/store/router'

import Input from '/components/styled/Input'
import Div from '/components/styled/Div'
import RadioButton from '/components/styled/RadioButton'
import Textarea from '/components/styled/Textarea'
import Password from '/components/styled/Password'
import Button from '/components/styled/Button'
import Help from '/components/styled/Help'
import Alert from '/components/styled/Alert'
import { Label, SubLabel } from '/components/styled/Label'
import {
    FormField,
    FormFieldLeft,
    FormFieldRight,
    FormFieldButtons
} from '/components/styled/Form'
import {
    ItemsList,
    ItemList,
    ItemListInner,
    ItemListItemRadio,
    ItemListItemLeft,
    ItemListItemRight
} from '/components/styled/ItemList'

const STEP = {
    typing: 'typing',
    addresses: 'addresses'
}

export default class ImportPrivate extends Component {
    componentWillMount() {
        const collector = collect()
        state.view.step = STEP.typing
        state.view.is_valid_input = false
        state.view.is_valid_seed = true
        state.view.seed_input = ''
        state.view.seed_input_error = ''
        state.view.seed_password = ''
        state.view.seed_repassword = ''
        state.view.discovering = false
        state.view.addresses = []
        state.view.address_selected = 0
        collector.destroy()

        this.observer = createObserver(m => this.forceUpdate())
        this.observer.observe(state.view)
        this.observer.observe(state.view.addresses, 'length')

        const { symbol } = getParamsFromLocation()
        this.Coin = Coins.hasOwnProperty(symbol) ? Coins[symbol] : Coins.ETH
        this.already_blur = false

        this.onChangeInput = this.onChangeInput.bind(this)
        this.onBlurInput = this.onBlurInput.bind(this)
        this.onChangePassword = this.onChangePassword.bind(this)
        this.onChangeRepassword = this.onChangeRepassword.bind(this)
        this.onNext = this.onNext.bind(this)
        this.onBack = this.onBack.bind(this)
        this.onChangeSelected = this.onChangeSelected.bind(this)
        this.onLoadMore = this.onLoadMore.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
    }
    componentWillUnmount() {
        this.observer.destroy()
    }
    shouldComponentUpdate() {
        return false
    }

    onUpdateSeed() {
        const seed = state.view.seed_input
        if (seed.length > 0) {
            const collector = collect()
            // const { address } = this.Coin.getWalletFromSeed({
            //     seed: seed
            // })

            state.view.is_valid_seed =
                validateSeed(seed) &&
                seed.trim().split(/\s+/g).length === recovery_phrase_words

            if (isAssetRegisteredBySeed(this.Coin.symbol, seed)) {
                state.view.seed_input_error = 'You already have this asset'
                state.view.is_valid_input = false
            } else {
                state.view.seed_input_error = ''
                state.view.is_valid_input = true
            }
            collector.emit()
        }
    }

    onChangeInput(e) {
        const collector = collect()
        const value = e.target.value.trim().replace(/\s+/g, ' ')
        state.view.seed_input = value
        if (this.already_blur) this.onUpdateSeed()
        collector.emit()
    }

    onBlurInput(e) {
        if (!this.already_blur && state.view.seed_input.length > 0) {
            this.already_blur = true
            this.onUpdateSeed()
        }
    }

    onChangePassword(e) {
        state.view.seed_password = e.target.value
    }
    onChangeRepassword(e) {
        state.view.seed_repassword = e.target.value
    }

    onNext(e) {
        e.preventDefault()
        const seed = state.view.seed_input
        const collector = collect()
        state.view.step = STEP.addresses
        this.discoverWallet(seed)
        collector.emit()
    }

    discoverWallet(seed) {
        const collector = collect()
        const addresses = state.view.addresses
        state.view.discovering = true
        this.Coin.discoverWallet({ seed }, wallet => {
            // console.log(addresses === state.view.addresses)
            if (addresses === state.view.addresses)
                state.view.addresses.push(wallet)
        }).then(wallet => {
            // console.log(wallet)
            if (addresses === state.view.addresses) {
                this.wallet = wallet
                this.wallet.seed = seed
                state.view.discovering = false
            }
        })
        collector.emit()
    }

    onLoadMore() {
        state.view.discovering = true
        this.Coin.discoverAddress(this.wallet).then(wallet => {
            // console.log(wallet)
            const collector = collect()
            this.wallet.index += 1
            state.view.discovering = false
            state.view.addresses.push(wallet)
            collector.emit()
        })
    }

    onBack(e) {
        e.preventDefault()
        const collector = collect()
        state.view.addresses = []
        state.view.step = STEP.typing
        collector.emit()
    }

    onChangeSelected(index) {
        state.view.address_selected = index
    }

    onSubmit(e) {
        e.preventDefault()
        const collector = collect()
        const seed = state.view.seed_input
        const symbol = this.Coin.symbol
        const address = this.Coin.multiaddress
            ? this.wallet.address
            : state.view.addresses[state.view.address_selected].address
        const addresses = state.view.addresses.map(wallet => wallet.address)
        const asset = createAsset(this.Coin.type, symbol, address, addresses)
        const asset_id = getAssetId(asset)
        setSeed(asset_id, seed, state.view.seed_password)
        setHref(routes.asset({ asset_id: asset_id }))
        addNotification(`New "${symbol}" asset has been imported`)
        collector.emit()
    }

    get isInvalidRepassword() {
        return (
            state.view.seed_password.length > 0 &&
            state.view.seed_repassword.length > 0 &&
            state.view.seed_password.length ===
                state.view.seed_repassword.length &&
            state.view.seed_password !== state.view.seed_repassword
        )
    }

    get isValidForm() {
        return (
            state.view.is_valid_input &&
            state.view.seed_input.length > 0 &&
            state.view.seed_password.length >= minpassword &&
            state.view.seed_password === state.view.seed_repassword
        )
    }

    render() {
        const addresses = state.view.addresses
        const total = addresses.reduce(
            (t, addr) => t.add(addr.balance),
            bigNumber(0)
        )
        return React.createElement(ImportPrivateTemplate, {
            Coin: this.Coin,
            step: state.view.step,
            seed_input: state.view.seed_input,
            seed_input_error: state.view.seed_input_error,
            seed_password: state.view.seed_password,
            seed_repassword: state.view.seed_repassword,
            discovering: state.view.discovering,
            addresses: state.view.addresses,
            address_selected: state.view.address_selected,
            total: total,
            is_valid_seed: state.view.is_valid_seed,
            isValidForm: this.isValidForm,
            isInvalidRepassword: this.isInvalidRepassword,
            onChangeInput: this.onChangeInput,
            onBlurInput: this.onBlurInput,
            onChangePassword: this.onChangePassword,
            onChangeRepassword: this.onChangeRepassword,
            onNext: this.onNext,
            onBack: this.onBack,
            onChangeSelected: this.onChangeSelected,
            onLoadMore: this.onLoadMore,
            onSubmit: this.onSubmit
        })
    }
}

function ImportPrivateTemplate({
    Coin,
    step,
    seed_input,
    seed_input_error,
    seed_password,
    seed_repassword,
    discovering,
    addresses,
    address_selected,
    total,
    is_valid_seed,
    isValidForm,
    isInvalidRepassword,
    onChangeInput,
    onBlurInput,
    onChangePassword,
    onChangeRepassword,
    onNext,
    onBack,
    onChangeSelected,
    onLoadMore,
    onSubmit
}) {
    return (
        <div>
            <Show if={step === STEP.typing}>
                <div>
                    <FormField>
                        <FormFieldLeft>
                            <Label>Recovery Phrase</Label>
                            <SubLabel>
                                Type your 12 words in the exact order.
                            </SubLabel>
                        </FormFieldLeft>
                        <FormFieldRight>
                            <Textarea
                                width="100%"
                                value={seed_input}
                                onChange={onChangeInput}
                                onBlur={onBlurInput}
                                error={seed_input_error}
                                invalid={
                                    seed_input_error && seed_input.length > 0
                                }
                            />
                            <Show if={!is_valid_seed && seed_input.length > 0}>
                                {/* <Div padding-top="10px"> */}
                                <Alert>
                                    You typed a non-standard or invalid Recovery
                                    Phrase. But Eldorado allow you to import any
                                    other format that comes from other wallets.
                                    Including other languages.
                                </Alert>
                                {/* </Div> */}
                            </Show>
                        </FormFieldRight>
                    </FormField>

                    <FormField>
                        <FormFieldLeft>
                            <Label>Password</Label>
                            <Help>
                                Make sure that you remember this. This password
                                can't be restored because we don't store it. For
                                security reasons you will be asked often for
                                this password.
                            </Help>
                            <SubLabel>
                                This password encrypts your seed key.
                            </SubLabel>
                        </FormFieldLeft>
                        <FormFieldRight>
                            <Password
                                minlength={minpassword}
                                value={seed_password}
                                onChange={onChangePassword}
                                width="100%"
                                type="password"
                            />
                        </FormFieldRight>
                    </FormField>

                    <FormField>
                        <FormFieldLeft>
                            <Label>Repeat Password</Label>
                        </FormFieldLeft>
                        <FormFieldRight>
                            <Input
                                minlength={minpassword}
                                error={'Passwords do not match'}
                                invalid={isInvalidRepassword}
                                value={seed_repassword}
                                onChange={onChangeRepassword}
                                width="100%"
                                type="password"
                            />
                        </FormFieldRight>
                    </FormField>

                    <FormField>
                        <FormFieldButtons>
                            <Button
                                width="100px"
                                disabled={!isValidForm}
                                onClick={onNext}
                            >
                                Next
                            </Button>
                        </FormFieldButtons>
                    </FormField>
                </div>
            </Show>
            <Show if={step === STEP.addresses}>
                <div>
                    <ItemsList>
                        {addresses.map((addr, index) => {
                            const selected =
                                Coin.multiaddress ||
                                (!Coin.multiaddress &&
                                    index === address_selected)
                            return (
                                <ItemList selected={selected}>
                                    <ItemListInner>
                                        <Show if={!Coin.multiaddress}>
                                            <ItemListItemRadio>
                                                <RadioButton
                                                    onClick={e =>
                                                        onChangeSelected(index)
                                                    }
                                                    checked={selected}
                                                />
                                            </ItemListItemRadio>
                                        </Show>
                                        <ItemListItemLeft>
                                            {addr.address}
                                        </ItemListItemLeft>
                                        <ItemListItemRight>
                                            {`${addr.balance} ${Coin.symbol}`}
                                        </ItemListItemRight>
                                    </ItemListInner>
                                </ItemList>
                            )
                        })}
                    </ItemsList>
                    <ResultAddress>
                        <Show if={!discovering}>
                            <LoadMore onClick={onLoadMore}>
                                Load more Addresses
                            </LoadMore>
                        </Show>
                        <Total>
                            {total} {Coin.symbol}
                        </Total>
                    </ResultAddress>
                    <Div margin-top="35px">
                        <FormField>
                            <FormFieldButtons>
                                <Button
                                    width="100px"
                                    loading={discovering}
                                    loadingIco="/static/image/loading.gif"
                                    onClick={onSubmit}
                                >
                                    Import
                                </Button>
                            </FormFieldButtons>
                            <FormFieldButtons>
                                <Button width="100px" onClick={onBack}>
                                    Back
                                </Button>
                            </FormFieldButtons>
                        </FormField>
                    </Div>
                </div>
            </Show>
        </div>
    )
}

export const ResultAddress = styled.div`
    border-top: 2px solid ${styles.color.background1};
    padding: 12px;
    font-size: 16px;
`
export const LoadMore = styled.a`
    font-size: 13px;
    color: ${styles.color.background2};
    text-decoration: underline;
    cursor: pointer;
    display: block;
    float: left;
    &:hover {
        color: ${styles.color.background3};
    }
`
export const Total = styled.div`
    color: ${styles.color.background2};
    font-weight: 900;
    float: right;
    font-size: 16px;
`