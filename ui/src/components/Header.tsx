import Button from "./Button"
import Breadcrumbs, { type Crumb } from "./Breadcrumbs"
import DropdownMenu from "./DropdownMenu"
import DropdownMenuItem from "./DropdownMenuItem"
import ImgLogo from "./../assets/images/logo-coloured-svg.svg"

const items: Crumb[] = [{ label: "Home", onClick: () => {} }]

function Header() {
  return (
    <header className="flex gap-[0.5em] items-center justify-between">
      <Button variant="image" color="default" src={ImgLogo} onClick={() => {}}>
        <strong className="font-bold text-pp-slate-900">Project Pulse</strong>
      </Button>

      <Breadcrumbs items={items} className="flex-1 mx-4" />

      <DropdownMenu label="Modules" color="primary">
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Projects
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Tasks
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Notes
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Activities
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem variant="text" onClick={() => {}}>
          Logout
        </DropdownMenuItem>
      </DropdownMenu>
    </header>
  )
}

export default Header
