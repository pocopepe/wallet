import {useState, useEffect } from "react";
import {generateMnemonic, mnemonicToSeed} from 'bip39';
import { derivePath, getPublicKey } from 'ed25519-hd-key'
import { PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import {ethers} from 'ethers';
import { Transaction, SystemProgram, Connection, sendAndConfirmTransaction} from "@solana/web3.js";
import { keccak256 } from "ethers";

function App() {
  const [mnemonic, setMnemonic]=useState('')
  const [solana, setSolana] = useState<string[]>([]); 
  const [eth, setEth]=useState<string[]>([]);
  const [solanaBalances, setSolanaBalances] = useState<{[key: string]: number}>({});
  const [ethBalances, setEthBalances]= useState<{[key: string]: number}>({});
  const [refreshSolana, setRefreshSolana]= useState(true);
  const [refreshEth, setRefreshEth]=useState(true);
  const apiKey=import.meta.env.VITE_THEKEY;
  const [solanaKeyPair, setSolanaKeyPair]=useState<Keypair[]>([]);
  
  useEffect(() => {
    const fetchBalances = async () => {
      for (const address of solana) {
        const balance = await fetchSolanaBalance(address);
        setSolanaBalances(prev => ({...prev, [address]: balance}));
      }
    };
    fetchBalances();
  }, [solana, refreshSolana]);

  
  useEffect(() => {
    const fetchBalances = async () => {
      for (const address of eth) {
        const balance = await fetchEthBalance(address);
        setEthBalances(prev => ({...prev, [address]: balance}));
      }
    };
    fetchBalances();
  }, [eth, refreshEth]);
  
  

function genmen(){
  const mnemonic = generateMnemonic();
  setMnemonic(mnemonic);
  setSolana([]);
}

async function gensolana(){
  const seed= await mnemonicToSeed(mnemonic);
  const derive = `m/44'/501'/${solana.length}'/0'`;
  const derivedSeed = derivePath(derive, seed.toString('hex'));
  const publicKey = new PublicKey(getPublicKey(derivedSeed.key));
  const privateKey= derivedSeed.key;
  setSolana([...solana, publicKey.toBase58()]);
  const keypair = Keypair.fromSeed(new Uint8Array(privateKey));
  setSolanaKeyPair([...solanaKeyPair, keypair]);
  console.log(solanaKeyPair);
}

async function fetchSolanaBalance(address:string){
  
  const url='https://solana-devnet.g.alchemy.com/v2/'+apiKey;
  const options = {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json'},
    body: JSON.stringify({id: 1, jsonrpc: '2.0', method: 'getBalance', params: [address] }),
  };

  const balance = await (await fetch(url, options)).json();
  const solBalance = balance.result.value/LAMPORTS_PER_SOL;
  return solBalance;
}

async function genEth(){
  const seed = await mnemonicToSeed(mnemonic);
  const path = `m/44'/60'/0'/0/${eth.length}`;

  const hdNode = ethers.HDNodeWallet.fromSeed(seed);
  const wallet = hdNode.derivePath(path);
  const address = "0x" + keccak256(wallet.publicKey).slice(-40);
  setEth([...eth, address]);
  console.log(wallet);
}

async function fetchEthBalance(address:string){
  const url ='https://eth-sepolia.g.alchemy.com/v2/'+apiKey;
  const options = {
    method: 'POST',
    headers: {accept: 'application/json', 'content-type': 'application/json'},
    body: JSON.stringify({id: 1, jsonrpc: '2.0', method: 'eth_getBalance', params: [address] }),
  };
  const balance = await (await fetch(url, options)).json();
  return Number(balance.result) / 1e18;
}

async function solanaTransaction(fromAddress:string, toAddress:string, amount:number, senderKeypair:Keypair){
  const transaction= new Transaction();
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const fromPubkey = new PublicKey(fromAddress);
  const toPubkey = new PublicKey(toAddress);

  const sendSolInstruction = SystemProgram.transfer({
    fromPubkey: fromPubkey,
    toPubkey: toPubkey,
    lamports: LAMPORTS_PER_SOL * amount,
  });
  transaction.add(sendSolInstruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    senderKeypair,
  ]);

  if(signature){
      return ("transaction passed"+signature);
  }
  return "transaction failed";
}

async function ethTransaction(){

}


  return (
  <>
  <div>A quick wallet to send and accept payments :0</div>
  <button onClick={genmen}>generateMnemonic</button>
  <div>Your Mnemonic is: {mnemonic}</div>
  <button onClick={gensolana}>Click here to generate solana</button>
  <br></br>
  <button onClick={()=>{setRefreshSolana(!refreshSolana)}}>Refresh Solana Balances</button>

    <button onClick={()=>{setRefreshEth(!refreshEth)}}>Refresh Eth Balances</button>
  <div>Your Solana Addresses are:</div>
  <ul>
          {solana.map((address, index) => (
            <li key={index} className="mb-2">
              {address} | Balance: {solanaBalances[address]?.toFixed(9) || '...'} SOL
            </li>
          ))}
        </ul>
    <button onClick={genEth}>Click here to generate eth</button>
    <div>Your Eth Addresses are:</div>
    <ul>
          {eth.map((address, index) => (
            <li key={index} className="mb-2">
              {address} | Balance: {ethBalances[address]?.toFixed(18)|| '...'} ETH
            </li>
          ))}
        </ul>
  </>
  )
}


   


export default App
