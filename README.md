# Teltec Social Wall

A web application that shows live Tweets and Instagram photos that contain a specified hashtag.

## How it works?

Twitter: A [Node-Red][1] flow connects with [Twitter][2] using supplied credentials to retrieve tweets in real-time filtered by the specified hashtags, then sends each tweet via [WebSocket][3] to the frontend application to present them.

Instagram: The backend uses the Instagram API to retrieve recent tagged media filtered by the specified hashtags, then sends each media via [WebSocket][3] to the frontend application to present them.

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