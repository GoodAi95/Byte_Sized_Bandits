namespace ScoreCircle.Models
{
    public class AppUser
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public List<CreditScore> CreditScores { get; set; } = new();
        public List<CircleMember> CircleMemberships { get; set; } = new();
        public List<Nudge> SentNudges { get; set; } = new();
        public List<Nudge> ReceivedNudges { get; set; } = new();
    }
}
