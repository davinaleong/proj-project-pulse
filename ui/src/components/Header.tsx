import Button from "./Button"
import DropdownMenu from "./DropdownMenu"
import DropdownMenuItem from "./DropdownMenuItem"
import ImgLogo from "./assets/images/logo-coloured-svg.svg"

function Header() {
  return (
    <header className="flex items-center justify-between">
      <Button
        variant="image"
        color="transparent"
        src={ImgLogo}
        onClick={() => {}}
      >
        <strong className="font-bold text-pp-slate-900">Project Pulse</strong>
      </Button>

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
