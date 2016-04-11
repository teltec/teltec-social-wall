# Teltec Live Tweets

A web application that shows live tweets that contain a specified hashtag.

## How it works?

It uses a [Node-Red][1] flow which connects with [Twitter][2] using supplied credentials to retrieve tweets in real-time filtered by the specified hashtags, then sends each tweet via [WebSocket][3] to the frontend application to present them.

## Screenshot

![Screenshot](https://raw.githubusercontent.com/teltec/teltec-live-tweets/master/screencapture.png)

## How to run?

	git clone https://github.com/teltec/teltec-live-tweets.git
	cd teltec-live-tweets
	npm install
	bower install
	grunt
	./bin/www

## TODO

- Promisify dependent events;


[1]: http://nodered.org/
[2]: http://www.twitter.com/
[3]: http://www.websocket.org/