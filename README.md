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

We recommend using Ansible for setting up a basic Email Specter instance. You can find the Ansible playbook in the [ansible](https://github.com/maileroo/email-specter/tree/main/ansible) directory and has been tested with Ubuntu 24.04 LTS.

First, clone the repository:

```
git clone https://github.com/maileroo/email-specter.git
```

Next, install Ansible and the required dependencies:

```
apt install ansible git -y;
ansible-galaxy install trfore.mongodb_install;
```

Then, fill out the inventory file with the required details. Generally, you will need to set the following variables:

```
public_ip: "127.0.0.1"
```

Specify the public IP address of your server where Email Specter will be hosted and accessed from.

Finally, run the Ansible playbook to set up Email Specter:

```
cd email-specter/ansible/scripts;
chmod +x run.sh;
./run.sh;
```

This will install all necessary dependencies, configure Email Specter, and start the service.

After the playbook is complete, you can access Email Specter at <em>http://{{ public_ip }}/</em>.

If you are looking to setup Email Specter manually, you can follow the steps below:

1. Install the required dependencies: 
   1. MongoDB 8.0
   2. Node.js 22
   3. Go 1.24
2. Clone the GitHub repository
3. Populate the .env file with the required environment variables (checkout ansible/templates/backend.env.j2 for a template)
4. Run the following commands to build and start Email Specter (using Go).
5. Go to `frontend` directory and run `npm install` to install the frontend dependencies.
6. Run `npm run build` to build the frontend.
7. Run `npm run start` to start the frontend server.
8. Go to `backend` directory and run `go build .` to build the backend executable.
9. Run `./email-specter` to start the backend server.

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
