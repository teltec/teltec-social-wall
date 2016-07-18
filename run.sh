#!/bin/bash
PORT=3000 \
	DOMAIN="socialapp.teltecsolutions.com.br" \
	USE_HTTPS="true" \
	HTTPS_KEY="/etc/letsencrypt/live/socialapp.teltecsolutions.com.br/privkey.pem" \
	HTTPS_CERT="/etc/letsencrypt/live/socialapp.teltecsolutions.com.br/fullchain.pem" \
	INSTAGRAM_CLIENT_ID="CHANGE_ME" \
	INSTAGRAM_CLIENT_SECRET="CHANGE_ME" \
	INSTAGRAM_ACCESS_TOKEN="CHANGE_ME" \
	TWITTER_CONSUMER_KEY="CHANGE_ME" \
	TWITTER_CONSUMER_SECRET="CHANGE_ME" \
	TWITTER_ACCESS_TOKEN_KEY="CHANGE_ME" \
	TWITTER_ACCESS_TOKEN_SECRET="CHANGE_ME" \
	node bin/www
