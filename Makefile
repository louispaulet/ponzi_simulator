PID_FILE := .vite.pid

.PHONY: up kill test build deploy

up:
	@if [ ! -d node_modules ]; then npm install; fi
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "Vite already running on PID $$(cat $(PID_FILE))"; \
	else \
		(nohup npm run dev > .vite.log 2>&1 < /dev/null & echo $$! > $(PID_FILE)); \
		echo "Vite started at http://localhost:5173/ponzi_simulator/"; \
	fi

kill:
	@if [ -f $(PID_FILE) ]; then \
		kill $$(cat $(PID_FILE)) 2>/dev/null || true; \
		rm -f $(PID_FILE); \
		echo "Vite stopped"; \
	else \
		pkill -f "vite --host 0.0.0.0" 2>/dev/null || true; \
		echo "No Vite PID file found"; \
	fi

test:
	npm test

build:
	npm run build

deploy:
	npm run deploy
