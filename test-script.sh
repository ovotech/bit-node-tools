OUTPUT=$(yarn --silent lerna exec --loglevel silent --concurrency 1 -- \
  'VERSION=$(node -p "require(\"./package.json\").version"); \
  if [ "$(npm view $LERNA_PACKAGE_NAME version --registry=https://npm.pkg.github.com/ 2>/dev/null || echo "0.0.0")" != "$VERSION" ]; then \
    echo "- **$LERNA_PACKAGE_NAME** - will publish version $VERSION"; \
  fi' | grep '^\- \*\*' || true)

echo "---"
if [ -n "$OUTPUT" ]; then
  echo "HAS CHANGES"
  echo "$OUTPUT"
else
  echo "NO CHANGES"
fi
