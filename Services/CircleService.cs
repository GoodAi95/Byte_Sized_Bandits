using ScoreCircle.Data;
using ScoreCircle.Models;
using Microsoft.EntityFrameworkCore;

namespace ScoreCircle.Services
{
    public class CircleService
    {
        private readonly AppDbContext _db;

        public CircleService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Circle> CreateCircleAsync(string name, string creatorUserId)
        {
            var circle = new Circle
            {
                Name = name,
                InviteCode = GenerateCode()
            };
            _db.Circles.Add(circle);
            await _db.SaveChangesAsync();

            // Creator is automatically a member
            _db.CircleMembers.Add(new CircleMember
            {
                CircleId = circle.Id,
                UserId = creatorUserId
            });
            await _db.SaveChangesAsync();
            return circle;
        }

        public async Task<CircleMember?> JoinByCodeAsync(string inviteCode, string userId)
        {
            var circle = await _db.Circles.FirstOrDefaultAsync(c => c.InviteCode == inviteCode.ToUpper());
            if (circle == null) return null;

            // Already a member?
            var already = await _db.CircleMembers
                .AnyAsync(cm => cm.CircleId == circle.Id && cm.UserId == userId);
            if (already) return null;

            var member = new CircleMember { CircleId = circle.Id, UserId = userId };
            _db.CircleMembers.Add(member);
            await _db.SaveChangesAsync();
            return member;
        }

        public async Task<List<Circle>> GetUserCirclesAsync(string userId)
        {
            return await _db.CircleMembers
                .Where(cm => cm.UserId == userId)
                .Include(cm => cm.Circle)
                .Select(cm => cm.Circle!)
                .ToListAsync();
        }

        public async Task SendNudgeAsync(int recipientMemberId, string senderUserId, string message)
        {
            _db.Nudges.Add(new Nudge
            {
                CircleMemberId = recipientMemberId,
                SenderId = senderUserId,
                Message = message
            });
            await _db.SaveChangesAsync();
        }

        private static string GenerateCode() =>
            Guid.NewGuid().ToString("N")[..8].ToUpper();
    }
}
