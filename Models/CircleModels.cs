namespace ScoreCircle.Models
{
    public class Circle
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string InviteCode { get; set; } = string.Empty;
        public string GoalDescription { get; set; } = "Everyone reaches Good by year end";
        public CreditTier GoalTier { get; set; } = CreditTier.Good;
        public DateTime GoalDeadline { get; set; } = new DateTime(DateTime.Now.Year, 12, 31);
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<CircleMember> Members { get; set; } = new List<CircleMember>();
    }

    public class CircleMember
    {
        public int Id { get; set; }
        public int CircleId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public bool ShareTier { get; set; } = true;       // share health tier (not raw score)
        public bool ShareDirection { get; set; } = true;  // share improving/declining
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Circle? Circle { get; set; }
        public AppUser? User { get; set; }
        public ICollection<Nudge> ReceivedNudges { get; set; } = new List<Nudge>();
    }

    public class Nudge
    {
        public int Id { get; set; }
        public int CircleMemberId { get; set; }   // recipient membership
        public string SenderId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CircleMember? Recipient { get; set; }
        public AppUser? Sender { get; set; }
    }
}
