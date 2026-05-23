namespace ScoreCircle.Models
{
    public class Advice
    {
        public int Id { get; set; }
        public int CreditScoreId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium"; // High / Medium / Low
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public CreditScore? CreditScore { get; set; }
    }
}
