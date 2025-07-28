
# TradeLens

  

This repository is structured as such:

-  **API**: FastAPI backend in `/api`.

-  **APP**: Vite+React frontend in `/app`

  

# Getting started

  

To get TradeLens running locally, procure the neccesary input data, and prepare your node and python environments.

## Data-prep

TradeLens relies on some data files too big for GitHub to track conveniently.

Run `data-setup.py` to download the neccesary files:

``` python data-setup```
  
## Backend

- Prerequisites: A recent Python version (tested with python 3.11).
1. Build a venv from the requirements.txt file:

```bash

python  -m  venv  trade_api_venv

source  trade_api_venv/bin/activate

pip  install  -r  requirements.txt

```
  

2. Launch main.py as usual, e.g. with uvicorn:

```bash

uvicorn  main:app  --reload

```
  

## Frontend

- Prerequisites: Node.js with NPM. At least version 18.18. Download [here](https://nodejs.org/en/download).
1. From `/app`, run `npm install` to install required packages
2. Run `npm run dev` to start the dev server
