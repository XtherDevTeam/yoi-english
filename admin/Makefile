buildFrontend:
	sudo chmod -R 777 /var/www/html
	sudo chmod -R 777 /etc/nginx/sites-enabled
	mkdir -p /var/www/html/yoi-english
	npm run build; cp -r -v ./build/* /var/www/html/yoi-english; cd ..
	# cp templates/nginx.conf /etc/nginx/sites-enabled/xms.conf

reloadNginx:
	sudo nginx -s reload