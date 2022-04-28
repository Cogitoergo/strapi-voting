# Strapi Voting

A plugin for [Strapi Headless CMS](https://github.com/strapi/strapi) that provides a simple voting system together with a moderation panel and logs.

## ✨ Features

- **Any Content Type relation:** Voting system can be linked to any of your content types, both collection and single.
- **Moderation Panel:** Search and filter through the logs and see various voting statistics.
- **Simple to use and change** Plugin is designed to provide a simple and seamless experience with extensive configuration compatabilities.

## ⏳ Installation

(Use **npm** to install this plugin within your Strapi project (recommended). [Install npm with these docs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).)

```bash
npm install strapi-plugin-voting@latest
```

After successful installation you've to build a fresh package that includes  plugin UI. To achieve that simply use:

```bash
npm run build
npm run develop
```

or just run Strapi in the development mode with `--watch-admin` option:

```bash
npm run develop --watch-admin
```

The **Voting** plugin should appear in the **Plugins** section of Strapi sidebar after you run app again.

Enjoy 🎉