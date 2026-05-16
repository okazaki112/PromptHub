#!/bin/bash
# Update Homebrew Cask formula with new version and SHA256 hashes
# Usage: ./scripts/update-homebrew-cask.sh <version> [release-tag]
# Example: ./scripts/update-homebrew-cask.sh 0.4.0 v0.4.0
# Example: ./scripts/update-homebrew-cask.sh 0.5.2 v0.5.2-rebuild.3
#
# This script is called by the CI release workflow after assets are uploaded.
# It downloads the DMG files, computes SHA256, updates the Cask formula,
# and pushes the changes to the homebrew-tap repository.

set -euo pipefail

VERSION="${1:?Usage: $0 <version> [release-tag]}"
RELEASE_TAG="${2:-v${VERSION}}"
REPO="legeling/PromptHub"
TAP_REPO="legeling/homebrew-tap"
CASK_FILE="Casks/prompthub.rb"
TAP_BRANCH="${HOMEBREW_TAP_BRANCH:-main}"
TAP_TOKEN="${HOMEBREW_TAP_TOKEN:-}"

if [ -z "$TAP_TOKEN" ]; then
  echo "HOMEBREW_TAP_TOKEN is not set; skipping Homebrew cask update."
  exit 0
fi

echo "Updating Homebrew Cask for PromptHub ${VERSION} from release tag ${RELEASE_TAG}..."

download_with_retry() {
  local url="$1"
  local output="$2"
  local label="$3"

  for attempt in 1 2 3 4 5; do
    echo "Downloading ${label} (attempt ${attempt}/5)..."
    if curl -fL --retry 3 --retry-delay 2 -o "$output" "$url"; then
      return 0
    fi
    sleep 10
  done

  echo "Failed to download ${label} after multiple attempts: ${url}"
  return 1
}

# Download DMGs and compute SHA256
ARM64_URL="https://github.com/${REPO}/releases/download/${RELEASE_TAG}/PromptHub-${VERSION}-arm64.dmg"
X64_URL="https://github.com/${REPO}/releases/download/${RELEASE_TAG}/PromptHub-${VERSION}-x64.dmg"

download_with_retry "$ARM64_URL" /tmp/prompthub-arm64.dmg "arm64 DMG"
ARM64_SHA=$(shasum -a 256 /tmp/prompthub-arm64.dmg | awk '{print $1}')
echo "arm64 SHA256: $ARM64_SHA"

download_with_retry "$X64_URL" /tmp/prompthub-x64.dmg "x64 DMG"
X64_SHA=$(shasum -a 256 /tmp/prompthub-x64.dmg | awk '{print $1}')
echo "x64 SHA256: $X64_SHA"

# Clone tap repo
WORK_DIR=$(mktemp -d)
echo "Cloning ${TAP_REPO} to ${WORK_DIR}..."
git clone "https://x-access-token:${TAP_TOKEN}@github.com/${TAP_REPO}.git" "$WORK_DIR"

# Generate updated Cask formula
cat > "${WORK_DIR}/${CASK_FILE}" <<EOF
cask "prompthub" do
  version "${VERSION}"

  on_arm do
    sha256 "${ARM64_SHA}"
    url "https://github.com/${REPO}/releases/download/v#{version}/PromptHub-#{version}-arm64.dmg"
  end

  on_intel do
    sha256 "${X64_SHA}"
    url "https://github.com/${REPO}/releases/download/v#{version}/PromptHub-#{version}-x64.dmg"
  end

  name "PromptHub"
  desc "Cross-platform prompt management tool for AI workflows"
  homepage "https://github.com/${REPO}"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "PromptHub.app"

  zap trash: [
    "~/Library/Application Support/PromptHub",
    "~/Library/Preferences/com.prompthub.app.plist",
    "~/Library/Saved Application State/com.prompthub.app.savedState",
  ]
end
EOF

echo "Updated Cask formula:"
cat "${WORK_DIR}/${CASK_FILE}"

# Commit and push
cd "$WORK_DIR"
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add "${CASK_FILE}"
if git diff --cached --quiet; then
  echo "Homebrew cask is already up to date."
else
  git commit -m "Update PromptHub to ${VERSION}"
  git push origin "${TAP_BRANCH}"
fi

# Cleanup
rm -rf "$WORK_DIR" /tmp/prompthub-arm64.dmg /tmp/prompthub-x64.dmg

echo "Done! Homebrew Cask updated to ${VERSION} from ${RELEASE_TAG}"
