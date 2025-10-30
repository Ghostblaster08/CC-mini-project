#!/bin/bash

echo "🧪 Flask Service Troubleshooting Script"
echo "========================================"

# Test 1: Service Status
echo "1. Checking systemd service status..."
sudo systemctl status prescription-parser --no-pager -l

echo ""
echo "2. Checking if Flask is listening on port 5000..."
sudo netstat -tlnp | grep 5000

echo ""
echo "3. Testing local health endpoint..."
curl -m 5 http://localhost:5000/health 2>/dev/null && echo "✅ Local health check passed" || echo "❌ Local health check failed"

echo ""
echo "4. Testing external health endpoint..."
curl -m 5 http://98.93.29.242:5000/health 2>/dev/null && echo "✅ External health check passed" || echo "❌ External health check failed"

echo ""
echo "5. Checking recent Flask service logs..."
sudo journalctl -u prescription-parser --no-pager -n 10

echo ""
echo "6. Checking firewall status..."
sudo ufw status

echo ""
echo "7. Testing with simple text parsing..."
curl -X POST http://localhost:5000/parse-text \
  -H "Content-Type: application/json" \
  -d '{"text":"1. Metformin 500mg - twice daily"}' 2>/dev/null && echo "✅ Text parsing test passed" || echo "❌ Text parsing test failed"

echo ""
echo "8. Process information..."
ps aux | grep python | grep -v grep

echo ""
echo "📋 If all tests fail, try:"
echo "   sudo systemctl restart prescription-parser"
echo "   sudo systemctl enable prescription-parser"
echo ""
echo "🔧 Manual start (if systemd fails):"
echo "   cd /opt/prescription-parser"
echo "   source venv/bin/activate"
echo "   python app.py"