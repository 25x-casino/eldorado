import React, { Component } from 'react'
import styled from 'styled-components'
import styles from '/const/styles'
import { version, repository } from './../../../package.json'

export default function Footer() {
    return (
        <FooterDiv>
            <div>
                <ul>
                    <li>
                        <a
                            href="https://github.com/dora-blue/eldorado/blob/master/FAQ.md"
                            target="_blank"
                        >
                            FAQ
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://parler.com/profile/dorablue"
                            target="_blank"
                        >
                            Parler
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://discord.gg/tvSx46N"
                            target="_blank"
                        >
                            Discord
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://t.me/joinchat/PyFqchhJwdPPP1l75bAoiw"
                            target="_blank"
                        >
                            Telegram
                        </a>
                    </li>
                    <li>
                        <a href="https://github.com/dora-blue/eldorado"
							target="_blank"
						>
                            GitHub Source
                        </a>
                    </li>
                </ul>
            </div>
        </FooterDiv>
    )
}

const FooterDiv = styled.div`
    /* height: ${styles.paddingOut}; */
    padding: 0 ${styles.paddingOut};
    ${styles.media.second} {
        div {
            display: none;
        }
    }
    div {
        padding-top: 15px;
    }
    ul {
        list-style: none;
        margin: 0;
    padding: 0;
    text-align: right;
    }
    li {
        display: inline-block;
    margin-left: 10px;
}
    }
    a {
        font-size: 12px;
        color: #000;
        font-weight: bold;
        letter-spacing: 0.2px;
        display: block;
        padding-right: 10px;
        text-align: right;
        opacity: 0.35;
    }
    a:hover {
        opacity: 0.5;
    }

`