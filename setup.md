# 1. Create Python virtual environment
python3 -m venv trade_api_venv

# 2. Activate it
source trade_api_venv/bin/activate

# 3. Install dependencies (includes requests library needed for data download)
pip install -r api/requirements_macos.txt

# 4. Download data files from S3 (~1GB+)
# Creates: api/data/BACI/, api/data/prodcom/, api/data/shared/
python data-setup.py

# Still in activated venv, from root directory
cd api

# Launch FastAPI server (defaults to http://localhost:8000)
uvicorn main:app --reload

# Prerequisites: Node.js 18.18+ (download from nodejs.org if needed)
node --version  # verify installation

# Install dependencies
cd app
npm install 


npm install --legacy-peer-deps   # if it flag vega issue, to resolve dependency conflicts

npm audit fix   # to fix any remaining vulnerabilities

# Start dev server (http://localhost:5173)
npm run dev