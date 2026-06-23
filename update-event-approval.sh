#!/bin/bash
# Update the Media Day event to disable requiresApproval
curl -X PATCH \
  "http://localhost:8090/api/collections/special_events/records/uo0axq5byi4c7qx" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PB_ADMIN_TOKEN" \
  -d '{
    "requiresApproval": false,
    "approvalThreshold": 500
  }' 2>/dev/null | jq '{id, name, requiresApproval, approvalThreshold}'
