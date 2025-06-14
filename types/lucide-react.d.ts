declare module 'lucide-react' {
  import { ComponentType } from 'react'
  
  interface IconProps {
    size?: number | string
    color?: string
    className?: string
  }
  
  type Icon = ComponentType<IconProps>
  
  export const MessageCircle: Icon
  export const Command: Icon
  export const Puzzle: Icon
  export const HelpCircle: Icon
  export const Trophy: Icon
  export const Shield: Icon
  export const Video: Icon
  export const Users: Icon
  export const Globe: Icon
  export const Calendar: Icon
  export const MessageSquare: Icon
  export const Menu: Icon
  export const UserCircle2: Icon
  export const Group: Icon
  export const Clock: Icon
  export const Plus: Icon
  export const Image: Icon
  export const Loader2: Icon
  export const Bold: Icon
  export const Italic: Icon
  export const Code: Icon
  export const Link: Icon
} 