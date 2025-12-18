# Email Specter

**Email Specter** is a powerful log analysis and monitoring tool for [KumoMTA](https://github.com/kumocorp/kumomta), designed to help you track email delivery, diagnose issues, and optimize performance through real-time insights and
detailed reporting.

## Features

- Live email delivery and bounce analytics dashboard
- Event and message search with advanced filters
- Detailed reports for delivery, bounces, and more
- MTA connection management (webhooks)
- Top domains, services, and IPs with instant search

## Installation

### Docker

The easiest way to run Email Specter is with Docker Compose:

```bash
git clone https://github.com/maileroo/email-specter.git
cd email-specter
cp .env.example .env
docker-compose up -d
```

Access Email Specter at `http://localhost/` (or your server's IP).

### Ansible

If you prefer a non-container solution, use Ansible. The playbook has been tested with Ubuntu 24.04 LTS.

```bash
git clone https://github.com/maileroo/email-specter.git
apt install ansible git -y
ansible-galaxy install trfore.mongodb_install
```

Edit the inventory file and set your public IP:

```
public_ip: "127.0.0.1"
```

Run the playbook:

```bash
cd email-specter/ansible/scripts
chmod +x run.sh
./run.sh
```

Access Email Specter at `http://<public_ip>/`.

### Manual

1. Install dependencies:
   - MongoDB 4.0+
   - Node.js 22
   - Go 1.24
2. Clone the repository
3. Copy `.env.example` to `.env` and configure
4. Build and run the backend:
   ```bash
   go build .
   ./email-specter
   ```
5. Build and run the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   npm run start
   ```

## Usage

Once Email Specter is installed and running, you can access it from your web browser at <em>http://{{ public_ip }}/</em>.

You will be prompted to create an admin user on the first visit. After that, you can log in with the credentials you set.

## Contributing

Contributions are welcome, but please open an issue to discuss your plans before doing any work on Email Specter.

## Contributors

- [**Areeb Majeed**](https://areeb.com): Creator & Maintainer
- **Patrick Yammouni**
- [**Maileroo**](https://maileroo.com)

## Support

If you need any help or have a question, please open an issue.

## Credits

- [KumoMTA](https://github.com/kumocorp/kumomta)
- [Zone Media OÜ](https://github.com/zone-eu/zone-mta) (please refer to NOTICE for license details)

## License

This project is licensed under the MIT License, except where otherwise noted.

Some files, as listed in the NOTICE file, are subject to the European Union Public License (EUPL) v1.2. These files remain under the EUPL, including any modifications made to them.
