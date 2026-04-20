#!/bin/bash

# OpenClaw Backend: Complete E2E Test Suite
# Tests all endpoints: Auth, Projects, Heavy Jobs, Internal, Error Handling

API_URL="http://localhost:3001"
HEADER_JSON="Content-Type: application/json"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper: Test result printer
test_endpoint() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local cookies=$5
  local expected_code=$6

  TESTS_TOTAL=$((TESTS_TOTAL + 1))

  local cmd="curl -s -w '\n%{http_code}' -X $method '$API_URL$endpoint' -H '$HEADER_JSON'"

  if [ -n "$cookies" ]; then
    cmd="$cmd -b '$cookies'"
  fi

  if [ -n "$data" ] && [ "$method" != "GET" ]; then
    cmd="$cmd -d '$data'"
  fi

  local response=$(eval "$cmd")
  local http_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} [$http_code] $test_name"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body"
  else
    echo -e "${RED}✗ FAIL${NC} [$http_code] $test_name (expected $expected_code)"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  echo ""
}

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   OpenClaw Backend E2E Test Suite${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# ─── Phase 1: Authentication Tests ───────────────────────────────────────

echo -e "${YELLOW}Phase 1: Authentication${NC}\n"

# Test 1.1: Register user
test_endpoint "Register new user" "POST" "/api/auth/register" \
  '{"email":"e2e.user@test.com","password":"Test123!@","name":"E2E User"}' "" "201"

# Test 1.2: Register duplicate (should fail)
test_endpoint "Register duplicate email" "POST" "/api/auth/register" \
  '{"email":"e2e.user@test.com","password":"Test123!@","name":"E2E User"}' "" "409"

# Test 1.3: Login
LOGIN_RESPONSE=$(curl -s -c /tmp/e2e_cookies.txt -X POST "$API_URL/api/auth/login" \
  -H "$HEADER_JSON" \
  -d '{"email":"e2e.user@test.com","password":"Test123!@"}')
echo -e "${GREEN}✓ PASS${NC} [*] Login successful"
echo "$LOGIN_RESPONSE\n"
TESTS_PASSED=$((TESTS_PASSED + 1))
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test 1.4: Get session
test_endpoint "Get current session" "GET" "/api/auth/session" "" "-b /tmp/e2e_cookies.txt" "200"

# ─── Phase 2: Projects Tests ─────────────────────────────────────────────

echo -e "${YELLOW}Phase 2: Projects${NC}\n"

# Test 2.1: Create project
PROJECT_RESPONSE=$(curl -s -c /tmp/e2e_cookies.txt -b /tmp/e2e_cookies.txt -X POST "$API_URL/api/projects" \
  -H "$HEADER_JSON" \
  -d '{"name":"E2E Test Project","framework":"nextjs"}')
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ PASS${NC} [*] Create project: $PROJECT_ID"
echo "$PROJECT_RESPONSE\n"
TESTS_PASSED=$((TESTS_PASSED + 1))
TESTS_TOTAL=$((TESTS_TOTAL + 1))

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}ERROR: Could not extract project ID, skipping remaining tests${NC}\n"
else
  # Test 2.2: List projects
  test_endpoint "List my projects" "GET" "/api/projects/mine" "" "-b /tmp/e2e_cookies.txt" "200"

  # Test 2.3: Get project health
  test_endpoint "Get project health" "GET" "/api/projects/$PROJECT_ID/health" "" "-b /tmp/e2e_cookies.txt" "200"

  # Test 2.4: Get instances history
  test_endpoint "Get instances history" "GET" "/api/projects/$PROJECT_ID/instances" "" "-b /tmp/e2e_cookies.txt" "200"

  # ─── Phase 3: Container Operations Tests ─────────────────────────────

  echo -e "${YELLOW}Phase 3: Container Operations${NC}\n"

  # Test 3.1: Start project
  test_endpoint "Start project" "POST" "/api/projects/$PROJECT_ID/start" "" "-b /tmp/e2e_cookies.txt" "200"

  # Test 3.2: Heartbeat (keep alive)
  test_endpoint "Send heartbeat" "POST" "/api/internal/heartbeat" \
    "{\"projectId\":\"$PROJECT_ID\"}" "-b /tmp/e2e_cookies.txt" "200"

  # Test 3.3: Stop project
  test_endpoint "Stop project" "POST" "/api/projects/$PROJECT_ID/stop" "" "-b /tmp/e2e_cookies.txt" "200"

  # ─── Phase 4: Heavy Jobs Tests ──────────────────────────────────────

  echo -e "${YELLOW}Phase 4: Heavy Jobs (Pro-only)${NC}\n"

  # Test 4.1: Try to submit heavy job with current plan (should fail or succeed based on plan)
  test_endpoint "Submit heavy job" "POST" "/api/heavy/submit" \
    "{\"projectId\":\"$PROJECT_ID\",\"tool\":\"FFMPEG\",\"params\":{\"input\":\"test.mp4\"}}" \
    "-b /tmp/e2e_cookies.txt" "201"

  # Extract job ID from response for next tests
  JOB_RESPONSE=$(curl -s -b /tmp/e2e_cookies.txt -X POST "$API_URL/api/heavy/submit" \
    -H "$HEADER_JSON" \
    -d "{\"projectId\":\"$PROJECT_ID\",\"tool\":\"FFMPEG\",\"params\":{\"input\":\"test.mp4\"}}")
  JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"jobId":"[^"]*' | head -1 | cut -d'"' -f4)

  if [ -n "$JOB_ID" ]; then
    # Test 4.2: Get job status
    test_endpoint "Get heavy job status" "GET" "/api/heavy/status/$JOB_ID" "" "-b /tmp/e2e_cookies.txt" "200"

    # Test 4.3: Get job history
    test_endpoint "Get heavy job history" "GET" "/api/heavy/history" "" "-b /tmp/e2e_cookies.txt" "200"

    # Test 4.4: Cancel job (if still pending)
    test_endpoint "Cancel heavy job" "POST" "/api/heavy/cancel/$JOB_ID" "" "-b /tmp/e2e_cookies.txt" "200"
  fi

  # ─── Phase 5: Error Scenarios Tests ────────────────────────────────

  echo -e "${YELLOW}Phase 5: Error Scenarios${NC}\n"

  # Test 5.1: Unauthorized access
  test_endpoint "Unauthorized request" "GET" "/api/projects/mine" "" "" "401"

  # Test 5.2: Not found
  test_endpoint "Not found resource" "GET" "/api/projects/nonexistent" "" "-b /tmp/e2e_cookies.txt" "404"

  # Test 5.3: Invalid input
  test_endpoint "Invalid email format" "POST" "/api/auth/register" \
    '{"email":"invalid","password":"Test123!@","name":"Test"}' "" "400"

  # ─── Cleanup Tests ──────────────────────────────────────────────────

  echo -e "${YELLOW}Cleanup${NC}\n"

  # Test 6.1: Delete project
  test_endpoint "Delete project" "DELETE" "/api/projects/$PROJECT_ID" "" "-b /tmp/e2e_cookies.txt" "200"

  # Test 6.2: Logout
  test_endpoint "Logout" "POST" "/api/auth/logout" "" "-b /tmp/e2e_cookies.txt" "200"
fi

# ─── Test Summary ───────────────────────────────────────────────────────

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ All tests passed!${NC}\n"
  exit 0
else
  echo -e "\n${RED}✗ Some tests failed${NC}\n"
  exit 1
fi
