import {generateMnemonic} from 'bip39';

function createMnemonic(){
    if(!localStorage.getItem('mnemonic')){
    const mnemonic = generateMnemonic()
    localStorage.setItem('mnemonic', JSON.stringify(mnemonic));
    return mnemonic;
}
};



export {createMnemonic};