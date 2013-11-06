
if [ $(whoami) != 'root' ]; then
echo "You have to execute this script as root user";
exit 1;
fi

# Get the first empty port
for port in $(seq 80 65000); do
    echo -ne "\035" | telnet 127.0.0.1 $port > /dev/null 2>&1;
    [ $? -eq 1 ] &&
    break;
done;

# Enable proxy mode
if [ ! -f /etc/apache2/mods-enabled/proxy.load ]; then
    cp  /etc/apache2/mods-available/proxy.load /etc/apache2/mods-enabled/proxy.load;
fi

if [ ! -f /etc/apache2/mods-enabled/proxy_ftp.load ]; then
    cp  /etc/apache2/mods-available/proxy_ftp.load /etc/apache2/mods-enabled/proxy_ftp.load;
fi

# Copy the application
rm -rf /var/www/mciconf;
cp -fR app/ /var/www/mciconf/;

# Check and create if not found the VirtualHost
if [ ! -f /etc/apache2/sites-enabled/mciconf ]; then echo "
<VirtualHost *:$port>
	DocumentRoot /var/www/mciconf/
	<Directory />
		Options FollowSymLinks
		AllowOverride None
	</Directory>
	<Directory /var/www/mciconf/>
		Options Indexes FollowSymLinks MultiViews
		AllowOverride None
		Order allow,deny
		allow from all
	</Directory>

    ProxyPass /ftp ftp://ftp.mozilla.org/pub/mozilla.org/firefox
    ProxyPassReverse /ftp ftp://ftp.mozilla.org/pub/mozilla.org/firefox
</VirtualHost>

NameVirtualHost *:$port
Listen $port
" >> /etc/apache2/sites-enabled/mciconf;
echo "Website running on 127.0.0.1:$port"
service apache2 restart;
fi

