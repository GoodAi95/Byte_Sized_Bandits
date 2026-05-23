using ScoreCircle.Models;

namespace ScoreCircle.ViewModels
{
    // ─── Personal Dashboard ───────────────────────────────────────────────────

    public class DashboardViewModel
    {
        public string UserName { get; set; } = string.Empty;
        public CreditScore Score { get; set; } = null!;
        public List<Advice> Advices { get; set; } = new();
        public string TierColor { get; set; } = string.Empty;
        public int TierPercent { get; set; }
        public List<Circle> UserCircles { get; set; } = new();
    }

    // ─── Circle Dashboard ────────────────────────────────────────────────────

    public class CircleMemberViewModel
    {
        public int MemberId { get; set; }
        public string DisplayName { get; set; } = string.Empty;  // first name only
        public CreditTier? SharedTier { get; set; }              // null if ShareTier=false
        public string? Direction { get; set; }                   // "↑ Improving" / "↓ Declining" / null
        public bool IsCurrentUser { get; set; }
    }

    public class CircleDashboardViewModel
    {
        public Circle Circle { get; set; } = null!;
        public List<CircleMemberViewModel> Members { get; set; } = new();
        public Dictionary<CreditTier, int> TierCounts { get; set; } = new();
        public int GoalProgressPercent { get; set; }
        public List<Nudge> RecentNudges { get; set; } = new();
        public int CurrentUserMemberId { get; set; }

        // Personal advice shown privately at bottom of circle page
        public CreditScore PersonalScore { get; set; } = null!;
        public List<Advice> PersonalAdvices { get; set; } = new();
        public string PersonalTierColor { get; set; } = string.Empty;

        // List of circles this user belongs to (sidebar)
        public List<Circle> AllUserCircles { get; set; } = new();
    }

    // ─── Join / Create forms ─────────────────────────────────────────────────

    public class CreateCircleViewModel
    {
        public string Name { get; set; } = string.Empty;
    }

    public class JoinCircleViewModel
    {
        public string InviteCode { get; set; } = string.Empty;
    }
}
