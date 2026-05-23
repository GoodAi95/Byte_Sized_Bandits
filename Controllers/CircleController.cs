using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScoreCircle.Data;
using ScoreCircle.Models;
using ScoreCircle.Services;
using ScoreCircle.ViewModels;

namespace ScoreCircle.Controllers
{
        public class CircleController : Controller
    {
                private readonly AppDbContext _db;
        private readonly CreditScoreService _creditService;
        private readonly AdviceService _adviceService;
        private readonly CircleService _circleService;

        public CircleController(
                        AppDbContext db,
            CreditScoreService creditService,
            AdviceService adviceService,
            CircleService circleService)
        {
                        _db = db;
            _creditService = creditService;
            _adviceService = adviceService;
            _circleService = circleService;
        }

        // GET /Circle/Index/5
        public async Task<IActionResult> Index(int id)
        {
            var user = await _db.Users.FirstAsync();

            // Verify user is a member
            var myMembership = await _db.CircleMembers
                .FirstOrDefaultAsync(cm => cm.CircleId == id && cm.UserId == user.Id);
            if (myMembership == null) return Forbid();

            var circle = await _db.Circles
                .Include(c => c.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (circle == null) return NotFound();

            // Build member view models — privacy enforced here
            var memberVms = new List<CircleMemberViewModel>();
            foreach (var m in circle.Members)
            {
                var latestScore = await _db.CreditScores
                    .Where(cs => cs.UserId == m.UserId)
                    .OrderByDescending(cs => cs.RecordedAt)
                    .FirstOrDefaultAsync();

                var fullNameFirst = m.User?.FullName?.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
                var emailFirst = m.User?.Email?.Split('@').FirstOrDefault();
                var displayName = !string.IsNullOrWhiteSpace(fullNameFirst) ? fullNameFirst
                    : !string.IsNullOrWhiteSpace(emailFirst) ? emailFirst
                    : "Member";

                string? direction = null;
                if (m.ShareDirection && latestScore != null)
                {
                    // Compare to previous score snapshot
                    var prev = await _db.CreditScores
                        .Where(cs => cs.UserId == m.UserId && cs.Id != latestScore.Id)
                        .OrderByDescending(cs => cs.RecordedAt)
                        .FirstOrDefaultAsync();
                    if (prev != null)
                        direction = latestScore.Score >= prev.Score ? " Improving" : " Declining";
                }

                memberVms.Add(new CircleMemberViewModel
                {
                    MemberId = m.Id,
                    DisplayName = displayName,
                    SharedTier = m.ShareTier ? latestScore?.Tier : null,
                    Direction = direction,
                    IsCurrentUser = m.UserId == user.Id
                });
            }

            // Tier counts for the group health bar
            var tierCounts = memberVms
                .Where(m => m.SharedTier.HasValue)
                .GroupBy(m => m.SharedTier!.Value)
                .ToDictionary(g => g.Key, g => g.Count());

            // Goal progress: how many members are at or above goal tier
            int atGoal = memberVms.Count(m => m.SharedTier.HasValue && m.SharedTier.Value >= circle.GoalTier);
            int total = memberVms.Count;
            int goalProgress = total > 0 ? (int)((double)atGoal / total * 100) : 0;

            // Nudge feed (last 20, newest first)
            var nudges = await _db.Nudges
                .Where(n => n.Recipient != null && n.Recipient.CircleId == id)
                .Include(n => n.Sender)
                .OrderByDescending(n => n.SentAt)
                .Take(20)
                .ToListAsync();

            // Personal score and advice (private to current user)
            var personalScore = await _creditService.GetOrSeedAsync(user.Id);
            var personalAdvices = await _adviceService.GetOrGenerateAsync(personalScore);
            var allCircles = await _circleService.GetUserCirclesAsync(user.Id);

            var vm = new CircleDashboardViewModel
            {
                Circle = circle,
                Members = memberVms,
                TierCounts = tierCounts,
                GoalProgressPercent = goalProgress,
                RecentNudges = nudges,
                CurrentUserMemberId = myMembership.Id,
                PersonalScore = personalScore,
                PersonalAdvices = personalAdvices,
                PersonalTierColor = CreditScoreService.TierColor(personalScore.Tier),
                AllUserCircles = allCircles
            };

            return View(vm);
        }

        // POST /Circle/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CreateCircleViewModel vm)
        {
            var user = await _db.Users.FirstAsync();

            var circle = await _circleService.CreateCircleAsync(vm.Name, user.Id);
            return RedirectToAction(nameof(Index), new { id = circle.Id });
        }

        // POST /Circle/Join
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Join(JoinCircleViewModel vm)
        {
            var user = await _db.Users.FirstAsync();

            var member = await _circleService.JoinByCodeAsync(vm.InviteCode, user.Id);
            if (member == null)
            {
                TempData["Error"] = "Invite code not found or you're already a member.";
                return RedirectToAction("Index", "Dashboard");
            }

            return RedirectToAction(nameof(Index), new { id = member.CircleId });
        }

        // POST /Circle/Nudge
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Nudge(int circleId, int recipientMemberId, string message)
        {
            var user = await _db.Users.FirstAsync();

            if (!string.IsNullOrWhiteSpace(message))
                await _circleService.SendNudgeAsync(recipientMemberId, user.Id, message.Trim());

            return RedirectToAction(nameof(Index), new { id = circleId });
        }
    }
}
