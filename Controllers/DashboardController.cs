using Microsoft.AspNetCore.Mvc;
using ScoreCircle.Models;
using ScoreCircle.Services;
using ScoreCircle.ViewModels;

namespace ScoreCircle.Controllers
{
        public class DashboardController : Controller
    {
                private readonly AppDbContext _db;
        private readonly CreditScoreService _creditService;
        private readonly AdviceService _adviceService;
        private readonly CircleService _circleService;

        public DashboardController(
                        CreditScoreService creditService,
            AdviceService adviceService,
            CircleService circleService)
        {
                        _creditService = creditService;
            _adviceService = adviceService;
            _circleService = circleService;
        }

        public async Task<IActionResult> Index()
        {
            var user = await _db.Users.FirstAsync();

            var score = await _creditService.GetOrSeedAsync(user.Id);
            var advices = await _adviceService.GetOrGenerateAsync(score);
            var circles = await _circleService.GetUserCirclesAsync(user.Id);

            var vm = new DashboardViewModel
            {
                UserName = user.FullName.Length > 0 ? user.FullName.Split(' ')[0] : user.Email!.Split('@')[0],
                Score = score,
                Advices = advices,
                TierColor = CreditScoreService.TierColor(score.Tier),
                TierPercent = CreditScoreService.TierPercent(score),
                UserCircles = circles
            };

            return View(vm);
        }
    }
}
