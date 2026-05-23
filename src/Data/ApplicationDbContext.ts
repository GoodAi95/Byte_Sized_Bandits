// ApplicationDbContext.ts
// Simulates Entity Framework Core DbContext with LocalStorage persistence
// In production ASP.NET, this would be replaced with actual EF Core + SQL Server

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const db = {
  get: getItem,
  set: setItem,
  remove: (key: string) => localStorage.removeItem(key),
};

// DbSet collection keys (equivalent to EF Core DbSets)
export const DbSets = {
  USERS: 'bsb_users',
  PROFILES: 'bsb_profiles',
  CURRENT_USER: 'bsb_current_user',
  CREDIT_HISTORY: 'bsb_credit_history',
  EXPENSES: 'bsb_expenses',
  INCOME: 'bsb_income',
  SAVING_PLANS: 'bsb_saving_plans',
  CIRCLES: 'bsb_circles',
  CIRCLE_POSTS: 'bsb_circle_posts',
  NUDGES: 'bsb_nudges',
  FRAUD_SCANS: 'bsb_fraud_scans',
  CASHBACK: 'bsb_cashback',
} as const;

/*
SQL Server Schema (for reference - would be in Migrations folder in real ASP.NET):

CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    AvatarColor NVARCHAR(20),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    Onboarded BIT DEFAULT 0
);

CREATE TABLE FinancialProfiles (
    UserId UNIQUEIDENTIFIER PRIMARY KEY REFERENCES Users(Id),
    CurrentCreditScore INT NOT NULL,
    MonthlyIncome DECIMAL(18,2),
    TotalSavings DECIMAL(18,2),
    TotalDebt DECIMAL(18,2),
    NumberOfCreditCards INT,
    NumberOfLoans INT,
    MonthlyRent DECIMAL(18,2),
    Gambling NVARCHAR(10) CHECK (Gambling IN ('No', 'Low', 'High')),
    HasInvestments BIT,
    HasMortgage BIT,
    MissedPayments INT,
    CreditUtilization INT,
    AgeOfCreditHistory DECIMAL(4,1),
    EmploymentStatus NVARCHAR(20),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE Expenses (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Amount DECIMAL(18,2) NOT NULL,
    Category NVARCHAR(50) NOT NULL,
    Description NVARCHAR(500),
    Date DATE NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE IncomeEntries (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Amount DECIMAL(18,2) NOT NULL,
    Source NVARCHAR(200) NOT NULL,
    Date DATE NOT NULL,
    Recurring BIT DEFAULT 0
);

CREATE TABLE SavingPlans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Name NVARCHAR(100) NOT NULL,
    GoalAmount DECIMAL(18,2) NOT NULL,
    CurrentAmount DECIMAL(18,2) DEFAULT 0,
    MonthlyContribution DECIMAL(18,2),
    Deadline DATE,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE ScoreCircles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    CreatedBy UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    InviteCode NVARCHAR(10) NOT NULL UNIQUE,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE CircleMembers (
    CircleId UNIQUEIDENTIFIER NOT NULL REFERENCES ScoreCircles(Id),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    JoinedAt DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (CircleId, UserId)
);

CREATE TABLE CircleGoals (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CircleId UNIQUEIDENTIFIER NOT NULL REFERENCES ScoreCircles(Id),
    Title NVARCHAR(200) NOT NULL,
    TargetAmount DECIMAL(18,2) NOT NULL,
    CurrentAmount DECIMAL(18,2) DEFAULT 0,
    Deadline DATE
);

CREATE TABLE CirclePosts (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CircleId UNIQUEIDENTIFIER NOT NULL REFERENCES ScoreCircles(Id),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Content NVARCHAR(MAX),
    Type NVARCHAR(20) CHECK (Type IN ('win', 'advice', 'update', 'nudge')),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE Nudges (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CircleId UNIQUEIDENTIFIER NOT NULL REFERENCES ScoreCircles(Id),
    FromUserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    ToUserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Message NVARCHAR(500),
    [Read] BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE FraudScans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    InputText NVARCHAR(MAX) NOT NULL,
    Result NVARCHAR(10) CHECK (Result IN ('Safe', 'Scam')),
    Confidence INT,
    ScannedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE CashBackRewards (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Merchant NVARCHAR(100) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    EarnedAt DATETIME2 DEFAULT GETDATE(),
    Redeemed BIT DEFAULT 0
);

CREATE TABLE CreditScoreHistory (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Score INT NOT NULL,
    PredictedScore INT NOT NULL,
    Date DATETIME2 DEFAULT GETDATE()
);
*/
