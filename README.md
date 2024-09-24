# chinese-checkers

Chinese checkers website, supporting online play, written with TypeScript, p5.js, and FastAPI. Contains an AI that uses a heuristic search algorithm.

Access the game at https://chinese-checkers.fly.dev/.

## Installation

To install the server:

```bash
git clone https://github.com/876pol/chinese-checkers.git
cd chinese-checkers
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd web
npm install
bash compile.sh
cd ..
```

To run the server:

```bash
fastapi run
```

The game can then be accessed at http://localhost:8000/.