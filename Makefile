PID_FILE := .vite.pid
SCREEN_NAME := ponzi_simulator_vite

.PHONY: up kill test build deploy

up:
	@if [ ! -d node_modules ]; then npm install; fi
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "Vite already running on PID $$(cat $(PID_FILE))"; \
	else \
		screen -S $(SCREEN_NAME) -X quit >/dev/null 2>&1 || true; \
		screen -dmS $(SCREEN_NAME) sh -c 'cd "$(CURDIR)" && ./node_modules/.bin/vite --host 0.0.0.0 > .vite.log 2>&1'; \
		sleep 1; \
		pgrep -f "node ./node_modules/.bin/vite --host 0.0.0.0" | head -n 1 > $(PID_FILE); \
		echo "Vite started at http://localhost:5173/"; \
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
	@screen -S $(SCREEN_NAME) -X quit >/dev/null 2>&1 || true

test:
	npm test

build:
	npm run build

deploy:
	npm run deploy
