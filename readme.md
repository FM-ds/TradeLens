
# TradeLens

  

This repository is structured as such:

-  **API**: FastAPI backend in `/api`.

-  **APP**: Vite+React frontend in `/app`

  

# Getting started

To get TradeLens running locally, procure the neccesary input data, and prepare your node and python environments.
  
## 1. Backend installation

Prerequisites: A recent Python version (tested with python 3.11).

### Windows quick install
Edit the windows_installer.bat to point to your chosen Python executable.

Double click the batch file called windows_installer.bat

### manual steps
Alternatively follow:
1. Build a virtual environment:

**On Mac**

```bash
python  -m  venv  trade_api_venv
source  trade_api_venv/bin/activate
```

**On Windows**

```bash
python  -m  venv  trade_api_venv
.\trade_api_venv\Scripts\activate
```

2. Install requirements:
To install the pyproject.toml requirements, navigate to `api` with:

```bash
cd api
```

and run 

```bash
pip  install  -e .
```
## 2. Front end installation
- Prerequisites: Node.js with NPM. At least version 18.18. Download [here](https://nodejs.org/en/download).
From `/app`, run `npm install` to install required packages

## 3. Download and prepare data:
TradeLens relies on some data files too big for GitHub to track conveniently.

From the root of the `\TradeLens` folder, run `data-setup.py` to download the neccesary files:
``` python data-setup```

## 4. launch the app
### Windows quick launch
Double click on the launch_tradelens.bat batch file to launch the front and back end in turn.

### Manual steps
Alternatively:

1. Activate API:
From `\api`, launch main.py with uvicorn 

```bash
uvicorn  main:app  --reload
```
2. launch front end by opening a terminal from `/app` and entering `npm run dev` to start the dev server.
