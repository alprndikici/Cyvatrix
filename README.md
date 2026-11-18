# Cyvatrix — IT 340 Milestone 1

Static front-end for the **Cyvatrix Personal Cybersecurity Awareness Platform**.

## Pages
- `index.html` — Home page, feature overview, and Get Started button
- `login.html` — Login UI
- `register.html` — Registration UI

## Run locally
Open `index.html` in a browser or run a local HTTP server from this directory:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`.

## Host on Ubuntu VM (Milestone 1)
1. Configure your Ubuntu VM's virtual networking according to your instructor's requirements.
2. Install Nginx on the VM (`sudo apt update && sudo apt install nginx`).
3. Copy the contents of the Cyvatrix directory into `/var/www/html/` (with appropriate permissions).
4. Check Nginx with `sudo nginx -t` and restart it with `sudo systemctl restart nginx`.
5. Confirm access from your browser to your VM's address, using the firewall and networking rules provided by the instructor.

**Important:** Request instructor approval before installing any tool not listed in the project specifications. Nginx is an example of a web server and may require approval.

## What is implemented?
- Responsive home, login, and register pages
- Working navigation links
- Password show/hide functionality
- Simple front-end registration password confirmation

## Not implemented yet
Real user authentication, password hashing, email verification, MongoDB, NVD API lookup, and logging are later milestones. Forms intentionally do not send or save credentials.

## AI assistance note
Initial HTML, CSS, JavaScript, and layout were created with assistance from ChatGPT. Review, test, and document AI contributions in accordance with the course instructions.
