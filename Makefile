# Makefile for the ARIS Javascript Editor
#
# Takes care of pulling code into build branch, combining all JS into one, and timestamping the index to avoid browser caches for changed files, and deploying.
#
# Some output is supressed, just remove the @ or dev/null redirects if troubleshooting.
#
OK_COLOR=\033[0;32m
INFO_COLOR=\033[1;36m
CLEAR=\033[m\017

help:
	@echo "Aris Javascript Editor"
	@echo ""
	@echo "Targets:"
	@echo "  merge: merge master into build branch"
	@echo "    css: compile less"
	@echo "  build: optimize all js into one file with requireJS"
	@echo "    all: merge compile optimize"
	@echo " heroku: push build branch to heroku"
	@echo " deploy: push build branch to aris"
	@echo ""
	@echo "make [all|css|build|deploy]"

css:
	@echo "Compiling LESS into CSS."
	@lessc styles/arisjs.less > styles/arisjs.css
	@echo "   $(OK_COLOR)(Done)"

build:
	@echo "Builing application into dist/aris.js."
	@r.js -o build.js 1>/dev/null
	@echo "   $(OK_COLOR)(Done)"

heroku:
	git push -f heroku build:master

deploy:
	@echo "Pushing to Github."
	@git push 1>/dev/null
	@echo "   (Done)"
	@echo "Deploying to server."
	@ssh aris-prod "cd /var/www/html/editor2/ && git checkout build && git pull" 1>/dev/null
	@echo "   $(OK_COLOR)(Done)"

render:
	@echo "Rendering template into index.html."
	@bin/render_index.sh
	@echo "   $(OK_COLOR)(Done)"

merge:
	@echo "Merging master onto build branch."
	@git merge master
	@echo "   $(OK_COLOR)(Done)"

note:
	@echo ""
	@echo "--- Now commit to the build branch and $(INFO_COLOR)make deploy$(CLEAR)! ---"
	@echo ""

all: merge css build render note
