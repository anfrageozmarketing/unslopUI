# Classic screens (inventory by family)

Use to check that an app has the screens people expect, and that each one is designed, not left default. Mark absent ones as not needed with a reason.

| Family | Screens |
|---|---|
| New user | Account setup · Guided tour and tutorial · Signup · Verification |
| Account | Delete and deactivate account · Forgot password · Login · My account and profile · Settings and preferences |
| Communication | Acknowledgement and success · Action options · Confirmation · Empty state · Error · Feature info · Feedback · Help and support · Loading · Permission · Suggestions and similar items |
| Commerce | Billing · Cart · Checkout · Order confirmation · Order detail · Order history · Payment method · Pricing · Promotions and rewards · Shop and storefront · Subscription and paywall · Wallet and balance |
| Social | Achievements · Chat detail · Comments · Followers · Invite teammates · Leaderboard · Notifications · Reviews and ratings · Social feed · User and group profile |
| Content | Article detail · Browse and discover · Lesson detail · Code editor · Emails and messages · Event detail · Goal and task · Home · News feed · Note detail · Post detail · Product detail · Quiz · Recipe · Media detail (song, podcast, show, movie) · Stories |
| Actions | Add and create · Ban and block · Cancel · Delete · Draw and annotate · Edit · Favorite and pin · Filter and sort · Flag and report · Follow · Import and export · Invite and refer · Like · Move · Publish · Reorder · Save · Schedule · Search · Select · Set · Share · Transfer money · Upload and download |
| Data | Charts · Dashboard · Progress |
| Collections | Bookmarks and collections · Playlists · Trash and archive |
| Utility | Audio player · Recorder · Calendar · Call · Canvas · Chat bot · Command palette · Date and time · Map · Media editor · QR code · Timeline and history · Timer · Video player |
| Layouts | Kanban board · Multi-column layout · Internal tool · Dark mode |

Checks:
- Communication screens (success, confirmation, empty, error, loading, permission) are the ones AI-built apps skip most. Every app needs all six, with specific text (`unslop-copy`).
- Settings, login, forgot password, verification and home exist in almost every app and are judged first.
- Each screen answers: what is it for, what is the one action.
