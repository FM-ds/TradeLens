You'll need baci_hs17_2017_2022.parquet in this directory for it to work. 

To set up the project from scratch, navigate to the api folder, then 

- Build a venv from the requirements.txt file:

```bash
python -m venv trade_api_venv
source trade_api_venv/bin/activate
pip install -r requirements.txt
```

- Launch main.py as usual, e.g. with uvicorn:

```bash
uvicorn main:app --reload
```