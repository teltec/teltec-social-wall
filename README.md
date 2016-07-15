# Teltec Social Wall

A web application that shows live Tweets and Instagram photos that contain a specified hashtag.

## How it works?

Twitter: The backend uses the Twitter API to receive live tweets filtered by the specified hashtags, then sends each tweet via [WebSocket][3] to the frontend application to present them.

Instagram: The backend uses the Instagram API to retrieve recent tagged media filtered by the specified tags, then sends each media via [WebSocket][3] to the frontend application to present them.

## Screenshot

![Screenshot](https://raw.githubusercontent.com/teltec/teltec-social-wall/master/screencapture.png)

## How to run?

	git clone https://github.com/teltec/teltec-social-wall.git
	cd teltec-social-wall
	npm install
	bower install
	grunt
	./bin/www

[1]: http://nodered.org/
[2]: http://www.twitter.com/
[3]: http://www.websocket.org/