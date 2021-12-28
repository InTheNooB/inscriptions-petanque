# Inscriptions Pétanque
This project is my first **React** project. It was initially made to train myself coding in **React**, but it might be used in real conditions during the summer 2022.
It allows : 
- Visitors to register to a tournament
- Admins to validate these registrations
- [WIP] Automatically send emails using an API to confirm registrations and validations
- [WIP] Allows validated registrations to pay the registration fee using **Twint** which automatically updates the paiement state

## Architecture
### Client (Frontend)
The client-side is developped in **ReactJs** [`/client`]
### Server (Backend)
The server-side is developped in **NodeJs** [`/server`]
### Database
There's no SQL/NoSQL database, the data is stored in **YAML** files [`/server/*.yml`]
### Hosting (Wamp)
I chose to host this project on my local machine using **WAMP** and making it accessible from the internet by forwarding the port ``:80`` to my machine and using my public ip address.
This step requires some reflexion because every request to the backend (API) must be forwarded to NodeJS and every other request must be forwarded to the static server hosting the **React** build files. An other thing that needs to be taken into account is the fact that **React** uses HTML5 Link State, and thus Apache2 must not look for a file if he receives a request like so : ``domain.com/login``.

[![](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBBKEludGVybmV0KSAtLT58UmVxdWVzdHwgQntBcGFjaGUyfVxuICAgIEIgLS0-fC9hcGl8IEMoTm9kZUpzKVxuICAgIEIgLS0-fGFueXwgRCh3d3cpIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRhcmsifSwidXBkYXRlRWRpdG9yIjp0cnVlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)](https://mermaid-js.github.io/mermaid-live-editor/edit#eyJjb2RlIjoiZ3JhcGggVERcbiAgICBBKEludGVybmV0KSAtLT58UmVxdWVzdHwgQntBcGFjaGUyfVxuICAgIEIgLS0-fC9hcGl8IEMoTm9kZUpzKVxuICAgIEIgLS0-fGFueXwgRCh3d3cpIiwibWVybWFpZCI6IntcbiAgXCJ0aGVtZVwiOiBcImRhcmtcIlxufSIsInVwZGF0ZUVkaXRvciI6dHJ1ZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

Multiple modifications need to be made to the config files in order for all this to work properly :

#### httpd-vhosts.conf
```conf
<VirtualHost *:80>
  ServerName domain.com
  ServerAlias domain.com
  DocumentRoot "${INSTALL_DIR}/www"
  
  ProxyRequests off
  ProxyPreserveHost on
  ProxyPass /api http://127.0.0.1:3001/api
  ProxyPassReverse /api http://127.0.0.1:3001/api
 
  <Directory "${INSTALL_DIR}/www">
    Options -Indexes +Includes +FollowSymLinks +MultiViews
    AllowOverride All
    Require all granted

    RewriteEngine on
    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    # Rewrite everything else to index.html to allow html5 state links
    RewriteRule ^ index.html [L]
  </Directory>
</VirtualHost>
```

#### httpd.conf
Remove comments from these lines to enable the required modules
```conf
 LoadModule rewrite_module modules/mod_rewrite.so
 LoadModule proxy_module modules/mod_proxy.so
 LoadModule proxy_http_module modules/mod_proxy_http.so
 LoadModule proxy_connect_module modules/mod_proxy_connect.so
```