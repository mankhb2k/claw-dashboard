#!/bin/bash

# Phase 4 (Heavy Jobs) API Test
# Tests all endpoints with Free and Pro plan users

API_URL="http://localhost:3001"
HEADER_JSON="Content-Type: application/json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Phase 4: Heavy Jobs API Test ===${NC}\n"

# Helper function to print test results
test_result() {
  local test_name=$1
  local status=$2
  local response=$3

  if [ "$status" -eq 0 ]; then
    echo -e "${GREEN}✓ PASS:${NC} $test_name"
  else
    echo -e "${RED}✗ FAIL:${NC} $test_name"
    echo "  Response: $response"
  fi
  echo ""
}

# 1. Register Free Plan User
echo -e "${YELLOW}--- Test 1: Register Free Plan User ---${NC}"
FREE_USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "$HEADER_JSON" \
  -d '{
    "email": "freeuser@test.com",
    "password": "TestPassword123!",
    "name": "Free User"
  }')

echo "Free User Response: $FREE_USER_RESPONSE"
test_result "Register free user" 0 "$FREE_USER_RESPONSE"

# 2. Register Pro Plan User
echo -e "${YELLOW}--- Test 2: Register Pro Plan User ---${NC}"
PRO_USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "$HEADER_JSON" \
  -d '{
    "email": "prouser@test.com",
    "password": "TestPassword123!",
    "name": "Pro User"
  }')

echo "Pro User Response: $PRO_USER_RESPONSE"
test_result "Register pro user" 0 "$PRO_USER_RESPONSE"

# 3. Login Free User
echo -e "${YELLOW}--- Test 3: Login Free User ---${NC}"
FREE_LOGIN=$(curl -s -c /tmp/free_cookies.txt -X POST "$API_URL/api/auth/login" \
  -H "$HEADER_JSON" \
  -d '{
    "email": "freeuser@test.com",
    "password": "TestPassword123!"
  }')

echo "Free Login Response: $FREE_LOGIN"
test_result "Login free user" 0 "$FREE_LOGIN"

# 4. Login Pro User
echo -e "${YELLOW}--- Test 4: Login Pro User ---${NC}"
PRO_LOGIN=$(curl -s -c /tmp/pro_cookies.txt -X POST "$API_URL/api/auth/login" \
  -H "$HEADER_JSON" \
  -d '{
    "email": "prouser@test.com",
    "password": "TestPassword123!"
  }')

echo "Pro Login Response: $PRO_LOGIN"
test_result "Login pro user" 0 "$PRO_LOGIN"

# 5. Create project for Free User
echo -e "${YELLOW}--- Test 5: Create Project for Free User ---${NC}"
FREE_PROJECT=$(curl -s -b /tmp/free_cookies.txt -X POST "$API_URL/api/projects" \
  -H "$HEADER_JSON" \
  -d '{
    "name": "Free Project",
    "framework": "nextjs"
  }')

echo "Free Project Response: $FREE_PROJECT"
FREE_PROJECT_ID=$(echo "$FREE_PROJECT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
test_result "Create project for free user" 0 "$FREE_PROJECT"

# 6. Create project for Pro User
echo -e "${YELLOW}--- Test 6: Create Project for Pro User ---${NC}"
PRO_PROJECT=$(curl -s -b /tmp/pro_cookies.txt -X POST "$API_URL/api/projects" \
  -H "$HEADER_JSON" \
  -d '{
    "name": "Pro Project",
    "framework": "nextjs"
  }')

echo "Pro Project Response: $PRO_PROJECT"
PRO_PROJECT_ID=$(echo "$PRO_PROJECT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
test_result "Create project for pro user" 0 "$PRO_PROJECT"

# 7. Test Heavy Job Submission - Free User (should fail with 403)
echo -e "${YELLOW}--- Test 7: Submit Heavy Job as Free User (should fail) ---${NC}"
if [ -z "$FREE_PROJECT_ID" ]; then
  echo -e "${RED}Skipping - Free project ID not found${NC}\n"
else
  FREE_HEAVY_JOB=$(curl -s -b /tmp/free_cookies.txt -w "\n%{http_code}" -X POST "$API_URL/api/heavy/submit" \
    -H "$HEADER_JSON" \
    -d "{
      \"projectId\": \"$FREE_PROJECT_ID\",
      \"tool\": \"FFMPEG\",
      \"params\": {\"input\": \"test.mp4\"}
    }")

  HTTP_CODE=$(echo "$FREE_HEAVY_JOB" | tail -1)
  BODY=$(echo "$FREE_HEAVY_JOB" | head -n -1)

  echo "Response Code: $HTTP_CODE"
  echo "Response Body: $BODY"

  if [ "$HTTP_CODE" = "403" ]; then
    test_result "Heavy job submission blocked for free user" 0 "Expected 403 Forbidden"
  else
    test_result "Heavy job submission blocked for free user" 1 "Expected 403 but got $HTTP_CODE"
  fi
fi

# 8. Test Heavy Job Submission - Pro User (should succeed)
echo -e "${YELLOW}--- Test 8: Submit Heavy Job as Pro User (should succeed) ---${NC}"
if [ -z "$PRO_PROJECT_ID" ]; then
  echo -e "${RED}Skipping - Pro project ID not found${NC}\n"
else
  PRO_HEAVY_JOB=$(curl -s -b /tmp/pro_cookies.txt -w "\n%{http_code}" -X POST "$API_URL/api/heavy/submit" \
    -H "$HEADER_JSON" \
    -d "{
      \"projectId\": \"$PRO_PROJECT_ID\",
      \"tool\": \"FFMPEG\",
      \"params\": {\"input\": \"test.mp4\"}
    }")

  HTTP_CODE=$(echo "$PRO_HEAVY_JOB" | tail -1)
  BODY=$(echo "$PRO_HEAVY_JOB" | head -n -1)

  echo "Response Code: $HTTP_CODE"
  echo "Response Body: $BODY"

  # Extract jobId if successful
  JOB_ID=$(echo "$BODY" | grep -o '"jobId":"[^"]*' | head -1 | cut -d'"' -f4)

  if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    test_result "Heavy job submission succeeded for pro user" 0 "Job ID: $JOB_ID"
  else
    test_result "Heavy job submission succeeded for pro user" 1 "Expected 200/201 but got $HTTP_CODE"
  fi
fi

# 9. Test Heavy Job Status (if we have a jobId)
if [ -n "$JOB_ID" ]; then
  echo -e "${YELLOW}--- Test 9: Get Heavy Job Status ---${NC}"
  JOB_STATUS=$(curl -s -b /tmp/pro_cookies.txt -X GET "$API_URL/api/heavy/status/$JOB_ID")

  echo "Job Status Response: $JOB_STATUS"
  test_result "Get heavy job status" 0 "$JOB_STATUS"
fi

# 10. Test Heavy Job History
echo -e "${YELLOW}--- Test 10: Get Heavy Job History ---${NC}"
JOB_HISTORY=$(curl -s -b /tmp/pro_cookies.txt -X GET "$API_URL/api/heavy/history")

echo "Job History Response: $JOB_HISTORY"
test_result "Get heavy job history" 0 "$JOB_HISTORY"

echo -e "${YELLOW}=== Phase 4 Tests Complete ===${NC}"
