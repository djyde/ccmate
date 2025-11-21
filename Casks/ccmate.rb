cask "ccmate" do
  version "0.3.4"
  sha256 "aa4472709c66d8521ed179c8c569baae07704e14e4559155b134e32b450d16fe"

  url "https://github.com/djyde/ccmate-release/releases/download/app-v#{version}/CC.Mate_#{version}_universal.dmg", verified: "github.com/djyde/ccmate-release"
  name "CC Mate"
  desc "A modern desktop application for managing Claude Code configuration files"
  homepage "https://randynamic.org/ccmate"

  livecheck do
    url :stable
    regex(/^app-v(\d+(?:\.\d+)*)$/i)
  end

  auto_updates true
  depends_on macos: ">= :big_sur"

  app "CC Mate.app"

  zap trash: [
    "~/Library/Application Support/CC Mate",
    "~/Library/Preferences/org.randynamic.ccconfig.plist",
    "~/Library/Caches/org.randynamic.ccconfig",
    "~/Library/Saved Application State/org.randynamic.ccconfig.savedState",
  ]
end