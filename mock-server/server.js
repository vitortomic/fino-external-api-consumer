const express = require('express');
const app = express();

app.use(express.json());

// Mock OnlyFans API endpoint for earning statistics
app.get('/api/:account/payouts/earning-statistics', (req, res) => {
  const { account } = req.params;
  
  // Generate mock earnings data with the actual OnlyFans API structure
  const mockEarnings = {
    data: {
      list: {
        months: {
          "1735689661": {
            tips: [
              {
                time: 1735689661,
                net: 4,
                gross: 5
              }
            ],
            total_net: 100,
            total_gross: 125,
            subscribes: [
              {
                time: 1735689661,
                net: 16,
                gross: 20
              }
            ]
          }
        },
        total: {
          tips: {
            total_net: 123.45,
            total_gross: 123.45
          },
          all: {
            total_net: 123.45,
            total_gross: 123.45
          },
          subscribes: {
            total_net: 123.45,
            total_gross: 123.45
          },
          chat_messages: {
            total_net: 123.45,
            total_gross: 123.45
          },
          post: {
            total_net: 123.45,
            total_gross: 123.45
          }
        }
      }
    },
    _meta: {
      _credits: {
        used: 1,
        balance: 999999842,
        note: "Always"
      },
      _cache: {
        is_cached: false,
        note: "Cache disabled for this endpoint"
      },
      _rate_limits: {
        limit_minute: 1000,
        limit_day: 50000,
        remaining_minute: 999,
        remaining_day: 49846
      }
    }
  };

  res.json(mockEarnings);
});

// Mock OnlyFans API endpoint for transactions
app.get('/api/:account/payouts/transactions', (req, res) => {
  const { account } = req.params;
  // Generate mock transactions data with the actual OnlyFans API structure
  const mockTransactions = {
    data: {
      list: [
        {
          amount: 12.34,
          vatAmount: 12.34,
          taxAmount: 12.34,
          mediaTaxAmount: 12.34,
          net: 12.34,
          fee: 12.34,
          createdAt: "2025-01-01T01:01:01+00:00",
          currency: "USD",
          description: "Subscription from <a href=\"https://onlyfans.com/username\">Name</a>",
          status: "loading",
          user: {
            view: "t",
            id: 123,
            name: "Name",
            username: "username",
            isVerified: false,
            avatar: null,
            avatarThumbs: null
          },
          payoutPendingDays: 7,
          id: "abc123"
        }
      ],
      marker: 123,
      hasMore: true,
      nextMarker: 1234
    },
    _meta: {
      _credits: {
        used: 1,
        balance: 999999845,
        note: "Always"
      },
      _cache: {
        is_cached: false,
        note: "Cache disabled for this endpoint"
      },
      _rate_limits: {
        limit_minute: 1000,
        limit_day: 50000,
        remaining_minute: 999,
        remaining_day: 49849
      }
    }
  };

  res.json(mockTransactions);
});

// Start the mock server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Mock OnlyFans API server running on port ${PORT}`);
});