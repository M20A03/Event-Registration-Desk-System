#!/bin/bash

echo "================================================="
echo "  Event Registration Desk System - GitHub Pusher  "
echo "================================================="
echo ""

# Ensure we are in a git repository
if [ ! -d .git ]; then
  echo "Error: This directory is not a Git repository."
  exit 1
fi

# Step 1: Stage all changes
echo "1. Staging changes..."
git add .

# Step 2: Prompt for commit message or use default
default_msg="Add Student ID, WiFi credentials, duplicate redirects, and Vercel config"
read -p "Enter commit message (Press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
  commit_msg="$default_msg"
fi

echo "2. Committing changes..."
git commit -m "$commit_msg"

# Step 3: Gather credentials
echo ""
echo "GitHub has disabled password authentication."
echo "Please provide your GitHub Username and Personal Access Token (PAT)."
echo "If you don't have a token, create one here:"
echo "https://github.com/settings/tokens (select 'repo' scope)"
echo ""

read -p "GitHub Username: " username
read -sp "GitHub Personal Access Token: " token
echo ""
echo ""

# Get the current remote URL
current_url=$(git remote get-url origin)
# Extract repository name (e.g. M20A03/Event-Registration-Desk-System)
repo_path=$(echo "$current_url" | sed -E 's|https://github.com/||' | sed -E 's|git@github.com:||' | sed -E 's|\.git||')

# Construct temporary authenticated URL
auth_url="https://${username}:${token}@github.com/${repo_path}.git"

# Step 4: Push using authenticated remote
echo "3. Pushing changes to GitHub..."
git remote set-url origin "$auth_url"

if git push origin main; then
  echo ""
  echo "SUCCESS: Code pushed successfully!"
  echo "Vercel will now automatically rebuild and deploy your app."
else
  echo ""
  echo "ERROR: Failed to push to GitHub. Please check your token permissions."
fi

# Step 5: Clean up credentials from remote URL for security
clean_url="https://github.com/${repo_path}.git"
git remote set-url origin "$clean_url"
echo "Security cleanup: Authenticated token removed from local git config."
echo "================================================="
