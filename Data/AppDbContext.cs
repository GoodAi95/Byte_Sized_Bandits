using Microsoft.EntityFrameworkCore;
using ScoreCircle.Models;

namespace ScoreCircle.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<AppUser> Users => Set<AppUser>();
        public DbSet<CreditScore> CreditScores => Set<CreditScore>();
        public DbSet<Advice> Advices => Set<Advice>();
        public DbSet<Circle> Circles => Set<Circle>();
        public DbSet<CircleMember> CircleMembers => Set<CircleMember>();
        public DbSet<Nudge> Nudges => Set<Nudge>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<AppUser>().HasData(new AppUser
            {
                Id = 1,
                FullName = "Demo User",
                Email = "demo@scorecircle.com"
            });
        }
    }
}
