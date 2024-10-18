import React, { useEffect } from "react";
import { OsmosisChainInfo } from "./constants";
import { Balances } from "./types/balance";
import { Dec, DecUtils } from "@keplr-wallet/unit";
import { isAddress } from "@ethersproject/address";
import { sendMsgs } from "./util/sendMsgs";
import { api } from "./util/api";
import { simulateMsgs } from "./util/simulateMsgs";
import { MsgSend } from "./proto-types-gen/src/cosmos/bank/v1beta1/tx";
import "./styles/container.css";
import "./styles/button.css";
import "./styles/item.css";
import { MsgConvertERC20 } from "./src/codec/shido/erc20/v1/tx";

function App() {
  const [address, setAddress] = React.useState<string>("");
  const [balance, setBalance] = React.useState<string>("");
  const [recipient, setRecipient] = React.useState<string>("");
  const [nativeRecipient, setNativeRecipient] = React.useState<string>("");
  const [hexSender, setHexSender] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");

  const [evmResult1, setEvmResult1] = React.useState<string>("");

  const [evmResult2, setEvmResult2] = React.useState<string>("");

  const [evmResult3, setEvmResult3] = React.useState<string>("");

  const [evmRecipient, setEvmRecipient] = React.useState<string>("");
  const [evmAmount, setEvmAmount] = React.useState<string>("");
  const [evmResult4, setEvmResult4] = React.useState<string>("");

  const [evmChainId, setEvmChainId] = React.useState<string>("");

  const [evmTokenAddress, setEvmTokenAddress] = React.useState<string>("");

  const [keplrEip6963ProviderInfo, setKeplrEip6963ProviderInfo] =
    React.useState<any>();

  useEffect(() => {
    window.addEventListener("eip6963:announceProvider", (e) => {
      const event = e as CustomEvent;
      if (event.detail.info.rdns === "app.keplr") {
        setKeplrEip6963ProviderInfo(event.detail.info);
      }
    });

    window.dispatchEvent(new Event("eip6963:requestProvider"));
    init();
  }, []);

  const init = async () => {
    const keplr = window.keplr;
    if (keplr) {
      try {
        await keplr.experimentalSuggestChain(OsmosisChainInfo);
        if (!keplr.ethereum?.isConnected()) {
          await keplr.ethereum?.enable();
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  };

  const getKeyFromKeplr = async () => {
    const key = await window.keplr?.getKey(OsmosisChainInfo.chainId);
    if (key) {
      setAddress(key.bech32Address);
    }
  };

  const getBalance = async () => {
    const key = await window.keplr?.getKey(OsmosisChainInfo.chainId);

    if (key) {
      const uri = `${OsmosisChainInfo.rest}/cosmos/bank/v1beta1/balances/${key.bech32Address}?pagination.limit=1000`;

      const data = await api<Balances>(uri);
      const balance = data.balances.find(
        (balance) => balance.denom === "shido"
      );
      const osmoDecimal = OsmosisChainInfo.currencies.find(
        (currency) => currency.coinMinimalDenom === "shido"
      )?.coinDecimals;

      if (balance) {
        const amount = new Dec(balance.amount, osmoDecimal);
        setBalance(`${amount.toString(osmoDecimal)} SHIDO`);
      } else {
        setBalance(`0 SHIDO`);
      }
    }
  };

  const sendBalance = async () => {
    if (window.keplr) {
      const key = await window.keplr?.getKey(OsmosisChainInfo.chainId);
      const protoMsgs = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: key.bech32Address,
          toAddress: recipient,
          amount: [
            {
              denom: "shido",
              amount: `${Number(amount) * 10 ** 18}`,
            },
          ],
        }).finish(),
      };

      try {
        const gasUsed = await simulateMsgs(
          OsmosisChainInfo,
          key.bech32Address,
          [protoMsgs],
          [{ denom: "shido", amount: "100000000" }]
        );

        if (gasUsed) {
          await sendMsgs(
            window.keplr,
            OsmosisChainInfo,
            key.bech32Address,
            [protoMsgs],
            {
              amount: [{ denom: "shido", amount: "100000000" }],
              gas: Math.floor(gasUsed * 1.5).toString(),
            }
          );
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  };

  const convertErc20toSHido = async () => {
    if (window.keplr) {
      const key = await window.keplr?.getKey(OsmosisChainInfo.chainId);
      console.log("protmessage======",`${Number(amount) * 10 ** 6}`);
      console.log("protmessage======",nativeRecipient);
      console.log("protmessage======",hexSender);
      const protoMsgs = {
        typeUrl: "/shido.erc20.v1.MsgConvertERC20",
        value: MsgConvertERC20.encode({
          contractAddress: "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd",
          amount: `${Number(amount) * 10 ** 6}`,
          receiver: nativeRecipient,
          sender:hexSender,
        }).finish(),
      };
 
      try {
        const gasUsed = await simulateMsgs(
          OsmosisChainInfo,
          key.bech32Address,
          [protoMsgs],
          [{ denom: "shido", amount: "100000000" }]
        );

        if (gasUsed) {
          await sendMsgs(
            window.keplr,
            OsmosisChainInfo,
            key.bech32Address,
            [protoMsgs],
            {
              amount: [{ denom: "shido", amount: "100000000" }],
              gas: Math.floor(gasUsed * 1.5).toString(),
            }
          );
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  };

  const hexToDecimal = (hex: string): string => {
    try {
     if(hex==''){
      return ""
     }
      // Remove '0x' prefix if it exists
      const cleanedHex = hex.startsWith("0x") ? hex.substring(2) : hex;

      // Convert hex to BigInt to handle large numbers
      const decimalValue = BigInt(`0x${cleanedHex}`);

      // Format the decimal value with commas for better readability
      return decimalValue.toLocaleString();
    } catch (e) {
      console.error("Error converting hex to decimal:");
      return "Invalid result";
    }
  };
  
  return (
    <div className="root-container">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <img
          src="/keplr-logo.png"
          style={{ maxWidth: "200px" }}
          alt="keplr-logo"
        />
      </div>

      <h2 style={{ marginTop: "30px" }}>
        Request to Shido Mainnet via Keplr Provider
      </h2>

      <div className="item-container">
        <div className="item">
          <div className="item-title">Get SHIDO Address</div>

          <div className="item-content">
            <div>
              <button className="keplr-button" onClick={getKeyFromKeplr}>
                Get Address
              </button>
            </div>
            <div>Address: {address}</div>
          </div>
        </div>

        <div className="item">
          <div className="item-title">Get SHIDO Balance</div>

          <div className="item-content">
            <button className="keplr-button" onClick={getBalance}>
              Get Balance
            </button>

            <div>Balance: {balance}</div>
          </div>
        </div>

        <div className="item">
          <div className="item-title">Send SHIDO</div>

          <div className="item-content">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              Recipient:
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              Amount:
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button className="keplr-button" onClick={sendBalance}>
              Send
            </button>
          </div>
        </div>

        <div className="item">
          <div className="item-title">Convert ERC20USDC to SHIDO NATIVE USDC</div>

          <div className="item-content">

          <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              Sender:
              <input
                type="text"
                value={hexSender}
                onChange={(e) => setHexSender(e.target.value)}
                placeholder="metamask hex address 0x"
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              Recipient:
              <input
                type="text"
                value={nativeRecipient}
                onChange={(e) => setNativeRecipient(e.target.value)}
                placeholder="shido native address shido"
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              Amount:
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button className="keplr-button" onClick={convertErc20toSHido}>
              Send
            </button>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: "60px" }}>
        Request to EVM Chain via Keplr Ethereum Provider
      </h2>

      <div
        className="item-container"
        style={{ maxWidth: 576, overflowWrap: "anywhere" }}
      >

        <div className="item">
          <div className="item-title">Get Data From Wallet</div>

          <div className="item-content">
            {[
              {
                method: "eth_chainId",
              }
            ].map(({ method }) => (
              <div key={method}>
                <button
                  className="keplr-button"
                  onClick={async () => {
                    const result = await window.keplr?.ethereum?.request({
                      method,
                    });
                    setEvmResult1(result.toString());
                  }}
                >
                  {method}
                </button>
              </div>
            ))}

            <div>Result: {hexToDecimal(evmResult1)}</div>
          </div>
        </div>

        <div className="item">
          <div className="item-title">Get Data From RPC Node</div>

          <div className="item-content">
            {[
              {
                method: "eth_blockNumber",
              },
              {
                method: "eth_getBalance",
                params: [window.keplr?.ethereum?.selectedAddress, "latest"],
              },
            ].map(({ method, params }) => (
              <div key={method}>
                <button
                  className="keplr-button"
                  onClick={async () => {
                    const result = await window.keplr?.ethereum?.request({
                      method,
                      params,
                    });
                    setEvmResult2(result);
                  }}
                >
                  {method}
                </button>
              </div>
            ))}

            <div>Result: {hexToDecimal(evmResult2)}</div>
          </div>
        </div>


      </div>
    </div>
  );
}

export default App;
