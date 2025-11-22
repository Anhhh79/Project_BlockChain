# Charity Admin Frontend

Simple static admin panel to manage campaigns and disburse funds.

Files:
- `index.html` — main UI
- `app.js` — frontend logic
- `charityAbi.json` — contract ABI (read-only)

Setup & Run:

1. Set `CONTRACT_ADDRESS` in `app.js` to your deployed contract address.
2. Serve the folder as a static site. From workspace root (Windows `cmd.exe`):

```cmd
cd dapp-fontend\admin
npx http-server . -p 3000
```

or if you have Python:

```cmd
cd dapp-fontend\admin
python -m http.server 3000
```

3. Open `http://localhost:3000` in a browser with MetaMask connected to the same network as your contract.

Notes:
- The UI is minimal; if you want React/Vite instead, tôi có thể scaffold tiếp.
- `disburseFromContract` will revert if the contract does not hold enough balance.
