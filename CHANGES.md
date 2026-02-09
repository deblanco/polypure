# Changelog

## [0.4.0] - 2026-02-09

### Added
- **Winston Logger** - Structured JSON logging throughout the SDK
  - All logs are JSON formatted for easy parsing
  - Configurable log level via `LOG_LEVEL` environment variable (default: debug)
  - Log files: `logs/combined-YYYY-MM-DD.log`, `logs/error-YYYY-MM-DD.log`
  - Separate files for exceptions and rejections
  - Error logging is always enabled regardless of log level
  - Logs rotate daily and are kept for 14 days

### Changed
- All console operations now use Winston for structured logging
- HTTP requests are logged with method, URL, and status
- Order operations (place, cancel) are logged with relevant details
- Error handling includes full stack traces and context
- Logs directory structure created with `.gitkeep` file

## [0.3.0] - 2026-02-09

### Added
- **Positions API** - Query current trading positions
  - `getCurrentPositions()` - Get authenticated user's positions
  - `getUserPositions(address)` - Get positions for any wallet address
  - `getMarketPositions(conditionId, address)` - Get positions in a specific market
  - `getAllPositions(address)` - Fetch all positions with automatic pagination

- **Profile Querying** - Query profiles and statistics for any wallet address
  - `getProfile(address)` - Get profile information for a user
  - `getPortfolio(address)` - Get portfolio summary with P/L calculations
  - `getUserTrades(options)` - Get trades for a specific user
  - `getAllUserTrades(address)` - Fetch all trades with automatic pagination
  - `getProfileStats(address)` - Calculate statistics from historical trade data

- **CLI Commands**
  - `positions` - Show your current positions
  - `user-positions <address>` - Show positions for a wallet address
  - `market-positions <id>` - Show positions in a market
  - `portfolio [--address]` - Show portfolio summary
  - `profile <address>` - Get profile information
  - `profile-stats <address>` - Calculate stats from trades
  - `user-trades <address>` - Get trades for a wallet address

- **New Types**
  - `Position` - Individual position data
  - `PositionSummary` - Aggregated positions per market
  - `PositionsResponse` - Response with positions and pagination
  - `UserProfile` - User profile information
  - `ProfileStats` - Calculated trading statistics
  - `UserPortfolio` - Portfolio summary with P/L
  - `UserTradesOptions` - Options for querying user trades
  - `UserTradesResponse` - Response with trades and pagination

- **CLI Option**
  - `--address <addr>` - Specify wallet address for profile queries

### Changed
- Updated README with comprehensive documentation for new features
- Updated help text to include new commands
- Updated version to 0.3.0
