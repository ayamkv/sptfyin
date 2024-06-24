<script>
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select/index.js";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import * as Accordion from "$lib/components/ui/accordion";
    import 'iconify-icon';
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = ua.includes("iphone os") || (ua.includes("mac os") && navigator.maxTouchPoints > 0);
    const isAndroid = ua.includes("android");
    const isMobile = ua.includes("android") || isIOS;
    const isSafari = ua.includes("safari/");
    const isFirefox = ua.includes("firefox/");
    const isOldFirefox = ua.includes("firefox/") && ua.split("firefox/")[1].split('.')[0] < 103;
	import { onMount } from "svelte";
    // import { z } from "zod";
    // import SuperDebug from "sveltekit-superforms";
    // import { zodClient } from "sveltekit-superforms/adapters";
    // import { toast } from "svelte-sonner";
    // import { browser } from "$app/environment";
    // import * as Form from "$lib/components/ui/form/index.js";
 
    // export const formSchema = z.object({
    //     username: z.string().min(2).max(50)
    // });

    // let data;
    // export { data as form };
    // const form = superForm(data, {
    //     validators: zodClient(formSchema),
    //     onUpdated: ({ form: f }) => {
    //       if (f.valid) {
    //         toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
    //       } else {
    //         toast.error("Please fix the errors in the form.");
    //       }
    //     }
    //   });
  
    // const { form: formData, enhance } = form;
    let inputText
    let isError = false;

    function findUrl(str) {
        const regex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/g;
        let urls = str.match(regex);
        return urls ? urls[0] : null;
    }

    async function handlePaste() {
        try {
            // Request permission to access the clipboard
            const permission = await navigator.permissions.query({ name: 'clipboard-read' });

            if (permission.state === 'granted' || permission.state === 'prompt') {
                // Read from the clipboard
                const text = await navigator.clipboard.readText();
                let clipboardContent = text;

                console.log(clipboardContent)
                console.log(findUrl(clipboardContent))
                inputText = findUrl(clipboardContent)
            // } else {
            //     alert('Clipboard access denied');
            }
        } catch (e) {
            let error = String(e).toLowerCase();

            if (error.includes("denied")) isError = true;
            console.error('Failed to read clipboard: ', error);
            if (error.includes("function") && isFirefox) alert('Firefox does not support clipboard access');
            if (error.includes("dismissed") || isIOS) alert('Sorry! IOS Safari does not support clipboard access 😔')

            
        }
    }

  
    // onMount(() => {
    //     handlePaste();
    // });



    let selected = { value: "sptfy.in", label: "Default: sptfy.in"}
    const domainList = [
    { value: "sptfy.in", label: "sptfy.in" },
    { value: "playlist.sptfy.in", label: "playlist.sptfy.in" },
    { value: "podcast.sptfy.in", label: "podcast.sptfy.in" },
    { value: "album.sptfy.in", label: "album.sptfy.in" },
    { value: "track.sptfy.in", label: "track.sptfy.in" },
    { value: "artist.sptfy.in", label: "artist.sptfy.in" }

  ];
</script>





<div class="flex flex-col items-center justify-center min-h-screen gap-6 bg-background p-10 -translate-y-8">

     
<AlertDialog.Root bind:open={isError}>
    <AlertDialog.Trigger></AlertDialog.Trigger>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <iconify-icon icon="fluent-emoji:crying-cat" class="block m-auto text-center" width=120></iconify-icon>
        <AlertDialog.Title class="text-center">Ouch, we have no permission!</AlertDialog.Title>
        
        <AlertDialog.Description>
            <b>sptfy.in</b> can't access the most recent item in your clipboard without your permission.
            <br><br>
            if you don't want to give access, you can paste the link manually instead.
            <br><br>
            if you do want to, go to site settings and enable the clipboard permission. <br><a class="underline underline-offset-4 font-semibold hover:outline outline-offset-4 rounded hover:text-primary" href="https://support.google.com/chrome/answer/114662?hl=en&co=GENIE.Platform%3DDesktop">see how to</a>
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Action class="min-w-full font-semibold" on:click={() => isError = false}>okay, got it</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
    <h1 class="text-4xl font-bold text-primary font-display">sptfyin</h1>
    <Card.Root class="w-[20rem] md:w-[35rem] sm:w-[20rem] transition-all">
        <Card.Header>
          <Card.Title>Shorten your URL</Card.Title>
          <Card.Description>Make your Spotify URLs looks pretty with one click, easy and fast!</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-4">
          
           
      
            <!-- <div class="flex-1 space-y-1">
              <p class="text-sm font-medium leading-none">Push Notifications</p>
              <p class="text-sm text-muted-foreground">
                Send notifications to device.
              </p>
            </div> -->
         
      
          <div>
            <form class="flex flex-col w-full min-w-full">
                <Label for="url" class="my-2">Paste your long ass URL here</Label>
                <div class="flex w-full min-w-full items-center align-center space-x-3 mb-2">
                    
                    <Input type="url" id="url" placeholder="https://open.spotify.com/xxxx...." bind:value={inputText} autofocus />
                    <Button class="hover:bg-primary hover:text-black" variant="secondary" on:click={() => handlePaste()}><iconify-icon width="20" icon="lucide:clipboard-copy"></iconify-icon></Button>
                </div>
                
                <Label for="domainSelect" class="my-2">Select domain</Label>
                <Select.Root portal={null} id="domainSelect" bind:selected>
                    <Select.Trigger class="">
                      <Select.Value placeholder="Domain: sptfy.in" selected="sptfy.in" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Label>Select domain</Select.Label>
                        {#each domainList as domain}
                          <Select.Item value={domain.value} label={domain.label}
                            >{domain.label}</Select.Item
                          >
                        {/each}
                      </Select.Group>
                    </Select.Content>
                    <Select.Input name="sptfy.in"/>
                  </Select.Root>
                  <Separator class="my-4"/>
                  <Accordion.Root>
                    <Accordion.Item value="item-1">
                      <Accordion.Trigger>Custom Short URL (Optional)</Accordion.Trigger>
                      <Accordion.Content>
                        <Label for="url" class="my-2">Custom URL here</Label>
                        <div class="flex w-full min-w-full items-center space-x-2 mb-2">
                            
                            <Input type="text" id="short_id" placeholder="https://open.spotify.com/xxxx...." />
                            
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                  
              </form>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button class="w-full">
            Short It!
          </Button>
        </Card.Footer>
      </Card.Root>
</div>
