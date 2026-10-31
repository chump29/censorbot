# ![CensorBot](./utils/images/censorbot.webp "CensorBot") CensorBot

> - CensorBot for Discord

---

![Bun](https://img.shields.io/badge/Bun-1.4.4-informational?style=plastic&logo=bun) &nbsp;
![discord.js](https://img.shields.io/badge/discord.js-14.28.0-informational?style=plastic&logo=discord.js)

![CodeQL](https://github.com/chump29/censorbot/workflows/CodeQL/badge.svg) &nbsp;
![Coverage](https://img.shields.io/badge/Coverage-78.99%25-success?style=plastic&logo=jest)

![NO AI](https://img.shields.io/badge/NO-AI-orange?style=plastic "NO AI") &nbsp;
![License](https://img.shields.io/github/license/chump29/censorbot?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3") &nbsp; <!-- markdownlint-disable MD013 -->
![CVE Scan](https://img.shields.io/badge/CVE%20Scan-Pass-success?style=plastic&logo=owasp "CVE Scan")

---

### What it does: <!-- markdownlint-disable-line MD001 -->

- Censors words

---

### 🔗 Invite Link <!-- markdownlint-disable-line MD001 -->

[Add CensorBot](https://discord.com/oauth2/authorize?client_id=1559690040861532191&permissions=536964096&integration_type=0&scope=bot)

---

### 🖥️ Discord <!-- markdownlint-disable-line MD001 -->

#### Role Permissions:

|   ⚙️ Permission    |
| :----------------: |
|     EmbedLinks     |
|   ManageMessages   |
|   ManageWebhooks   |
| ReadMessageHistory |
|    SendMessages    |
|    ViewChannel     |

#### Commands:

| 📋 Task | 🔧 Command | ⚙️ Permission |
| :-----: | :--------: | :-----------: |
|  Info   |  `/info`   |     None      |
|  Ping   |  `/ping`   |     None      |

---

### 🖧 Docker

#### Environment Variables:

|     📝 Description      | 📌 Variable |  {...} Value   |
| :---------------------: | :---------: | :------------: |
|        Activity         |  ACTIVITY   |   Censoring    |
| Embed Color<sup>1</sup> |    COLOR    |    #78866b     |
|          Debug          |    DEBUG    | true/**false** |
|    Level<sup>2</sup>    |    LEVEL    |       3        |
|        Bot Name         |    NAME     |   CensorBot    |
|        Bot Token        |    TOKEN    |    \<token>    |

###### <sup>1</sup> #RRGGBB format <!-- markdownlint-disable-line MD001 -->

###### <sup>2</sup> Level information @ [Levels](https://github.com/awdev1/better-profane-words#intensity-scale)

##### From `@postfmly/logoserver`:

| 📝 Description | 📌 Variable |    {...} Value    |
| :------------: | :---------: | :---------------: |
|   Logo Name    |  LOGO_NAME  |  censorbot.webp   |
|   Local Path   |  LOGO_PATH  |  ./utils/images   |
|      Port      |  LOGO_PORT  | **Random**/[port] |
|    Logo URL    |  LOGO_URL   |      \<url>       |

##### From `@postfmly/checkrate`:

###### _NOTE: Rate limited to 1 request per 1 second_

#### Deployment:

|  📜 Script  |  🔧 Command   |
| :---------: | :-----------: |
|    Full     | `./build.sh`  |
| Docker Only | `./docker.sh` |

---

### 📄 Documentation

### Generate:

```bash
./docs.sh
```

---

### 🛰️ Git & CI/CD

- **Pre-Commit:** Staged files are automatically linted
- **Github Actions:** Builds and pushes images to repository
  - latest
    - amd64
    - arm64
