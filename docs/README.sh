#!/usr/bin/env -S bash -e

export _user=chump29
export _repo=censorbot

echo -e "📌 Packages:\n"

_bun=$(bun --version)
export _bun
echo -e " • Bun: $_bun"

_discord=$(jq -r '.dependencies."discord.js" // "❓"' ../package.json)
_discord=${_discord:1}
export _discord
echo -e " • discord.js: $_discord"

_envalid=$(jq -r '.dependencies.envalid // "❓"' ../package.json)
_envalid=${_envalid:1}
export _envalid
echo -e " • Envalid: $_envalid"

_valibot=$(jq -r '.dependencies.valibot // "❓"' ../package.json)
_valibot=${_valibot:1}
export _valibot
echo -e " • Valibot: $_valibot"

echo -e "\n🧪 Running tests…"
bun run test:coverage

_coverage=0
if [ -f "../tests/coverage/lcov.info" ]; then
  _coverage=$(bun run --bun lcov-total ../tests/coverage/lcov.info)
fi
export _coverage
echo -e "\n☂️  Coverage: $_coverage%"

echo -e "\n🛠️  Creating README.md..."

envsubst < README.template.md > ../README.md

echo -e "\n✔️  Done!\n"
