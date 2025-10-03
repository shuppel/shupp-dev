# Emoji Replacement List

## Icon Library Recommendations

### Best Matches for Ink/Liquid Aesthetic:

1. **Phosphor Icons** (Recommended)
   - Hand-drawn aesthetic with organic, fluid strokes
   - 6 weights including "duotone" for ink-wash effect
   - Over 7000+ icons
   - React/Vue/Web components available
   - Install: `npm install phosphor-icons`
   - Very similar to hand-drawn ink illustrations

2. **Tabler Icons**
   - Clean, minimal stroke-based icons
   - 3400+ icons with consistent stroke width
   - Perfect for liquid/flowing interfaces
   - Install: `npm install @tabler/icons-react`

3. **Lucide Icons** (Fork of Feather)
   - Beautiful, consistent stroke icons
   - Community-driven with 1000+ icons
   - Clean ink-pen aesthetic
   - Install: `npm install lucide-react`

4. **Heroicons**
   - Hand-crafted by Tailwind team
   - Outline style perfect for ink aesthetic
   - Install: `npm install @heroicons/react`

## Current Emoji Usage & Replacement Suggestions

### Status Indicators
- 🟢 Active → Use Phosphor `CircleFill` with green color
- 🟡 Beta → Use Phosphor `CircleHalfFill` with yellow
- ⚫ Shelved → Use Phosphor `Circle` with gray
- 🔵 Concept → Use Phosphor `CircleDashed` with blue

### Navigation/UI
- ✓ Checkmark → Use Phosphor `Check` or `CheckCircle`
- ☀️ Light mode → Use Phosphor `Sun`
- 🌙 Dark mode → Use Phosphor `Moon`
- › Chevron → Use Phosphor `CaretRight`
- ✉️ Email → Use Phosphor `Envelope`
- 🔗 Link → Use Phosphor `Link`
- 📋 Copy → Use Phosphor `Clipboard`
- 🔄 Refresh → Use Phosphor `ArrowsClockwise`

### Categories/Features
- 💰 Financial → Use Phosphor `CurrencyDollar` or `Wallet`
- ⚡ Productivity → Use Phosphor `Lightning`
- 🏃 Health → Use Phosphor `PersonSimpleRun`
- 🌟 Lifestyle → Use Phosphor `Star`
- 📊 Analytics → Use Phosphor `ChartBar`
- 📈 Growth → Use Phosphor `TrendUp`
- 🔥 Hot/Trending → Use Phosphor `Fire`
- ⚖️ Balance → Use Phosphor `Scales`

### Tools/Development
- 💼 Portfolio → Use Phosphor `Briefcase`
- 🔧 Tools → Use Phosphor `Wrench`
- 📦 Package → Use Phosphor `Package`
- 🐛 Bug → Use Phosphor `Bug`
- 🔀 Pull Request → Use Phosphor `GitPullRequest`
- 📂 Repository → Use Phosphor `FolderOpen`
- 🐙 GitHub → Use Phosphor `GithubLogo`

### Property/Real Estate
- 🏠 Single Family → Use Phosphor `House`
- 🏢 Condo → Use Phosphor `Buildings`
- 🏘️ Townhouse → Use Phosphor `HouseLine`
- 🏗️ Multi-Family → Use Phosphor `Building`
- 🗝️ Rent → Use Phosphor `Key`

### User/Social
- 👤 Single User → Use Phosphor `User`
- 👥 Multiple Users → Use Phosphor `Users`
- 👍 Like/Vote → Use Phosphor `ThumbsUp`
- 💬 Comment → Use Phosphor `ChatCircle`
- 🦋 Social → Use Phosphor `Butterfly`

### Financial/Money
- 💵 Cash → Use Phosphor `Money`
- 💰 Savings → Use Phosphor `PiggyBank`
- 🔑 Key/Access → Use Phosphor `Key`
- 🛡️ Security → Use Phosphor `Shield`

### Time/Calendar
- 🕐 Time → Use Phosphor `Clock`
- 📅 Calendar → Use Phosphor `Calendar`

### Travel/Location
- 🚗 Car → Use Phosphor `Car`
- ✈️ Travel → Use Phosphor `Airplane`

### Warnings/Info
- ⚠️ Warning → Use Phosphor `Warning`
- ❌ Error/No → Use Phosphor `X` or `XCircle`
- ✅ Success/Yes → Use Phosphor `CheckCircle`
- ❄️ Cold/Cooling → Use Phosphor `Snowflake`

### Ideas/Innovation
- 💡 Idea → Use Phosphor `Lightbulb`
- 🚀 Launch/Speed → Use Phosphor `Rocket`

### Education
- 📚 Books/Learn → Use Phosphor `Books`
- 🎓 Graduate → Use Phosphor `GraduationCap`

## Implementation Strategy

1. Install Phosphor Icons:
```bash
npm install phosphor-icons @phosphor-icons/react
```

2. Create an Icon component wrapper:
```tsx
import * as Phosphor from '@phosphor-icons/react';

export const Icon = ({ name, weight = 'regular', ...props }) => {
  const IconComponent = Phosphor[name];
  return <IconComponent weight={weight} {...props} />;
};
```

3. Use duotone weight for ink-wash effect:
```tsx
<Icon name="House" weight="duotone" size={24} />
```

4. Apply custom CSS for liquid effect:
```css
.icon-liquid {
  filter: url(#liquid-distortion);
  transition: all 0.3s ease;
}

.icon-liquid:hover {
  transform: scale(1.1);
  filter: url(#liquid-distortion-hover);
}
```

## Priority Replacements

High priority (most visible):
1. Dark/Light mode toggle (☀️/🌙)
2. Status indicators (🟢🟡⚫)
3. Category icons (💰⚡🏃🌟📊)
4. Checkmarks (✓)
5. Navigation chevrons (›)

Medium priority:
1. Property types (🏠🏢🏘️)
2. User icons (👤👥)
3. Financial icons (💵💰)
4. Tool icons (🔧📦)

Low priority:
1. Social icons (already using proper logos mostly)
2. Decorative emojis
3. One-off usage emojis